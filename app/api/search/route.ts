import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";
import { getVoyageClient } from "@/utils/clients";
import { formatEmbeddingForPostgres } from "@/utils/chunking/embeddingUtils";
import {
  SEARCH_RESULT_LIMIT,
  SEARCH_FALLBACK_LIMIT,
  SEMANTIC_SIMILARITY_THRESHOLD,
  SEMANTIC_SIMILARITY_THRESHOLD_STRICT,
  HYBRID_VECTOR_WEIGHT,
  HYBRID_KEYWORD_WEIGHT,
  VOYAGE_MODEL,
} from "@/config/constants";

const sql = neon(process.env.POSTGRES_URL!);

type ScoreType = "keyword" | "hybrid" | "semantic";

interface DbRow {
  content: string;
  post_slug: string;
  post_title: string;
  chunk_type: string;
  metadata?: {
    tags?: string[];
    published_date?: string;
    section?: string;
    language?: string;
  };
  keyword_score?: number;
  hybrid_score?: number;
  vector_similarity?: number;
  text_rank?: number;
}

function mapRow(row: DbRow, scoreType: ScoreType) {
  const similarity =
    scoreType === "keyword"
      ? Number(row.keyword_score?.toFixed(4)) || 0
      : scoreType === "hybrid"
        ? Number(row.hybrid_score?.toFixed(4)) || 0
        : Number(row.vector_similarity?.toFixed(4)) || 0;

  return {
    content: row.content,
    post_slug: row.post_slug,
    post_title: row.post_title,
    chunk_type: row.chunk_type,
    tags: row.metadata?.tags ?? [],
    published_date: row.metadata?.published_date,
    similarity,
    score_type: scoreType,
    section: row.metadata?.section,
    language: row.metadata?.language,
    ...(scoreType === "hybrid" && {
      vector_similarity: Number(row.vector_similarity?.toFixed(4)) || 0,
      keyword_score: Number(row.text_rank?.toFixed(4)) || 0,
    }),
  };
}

function prepareSearchQuery(input: string, operator = "&"): string {
  const sanitized = input.replace(/['&|!():*]/g, " ").trim();
  const terms = sanitized.split(/\s+/).filter(Boolean);
  if (terms.length === 0) return "";
  if (terms.length === 1) return terms[0];
  return terms.map((t) => t + ":*").join(` ${operator} `);
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json(
      { error: "Expected a search request" },
      { status: 400 }
    );
  }
  const input = body as Record<string, unknown>;
  if (
    typeof input.query !== "string" ||
    !input.query.trim() ||
    input.query.length > 2000
  ) {
    return NextResponse.json(
      { error: "Query must contain 1–2000 characters" },
      { status: 400 }
    );
  }
  const query = input.query.trim();
  const searchType = input.searchType ?? "hybrid";
  if (
    typeof searchType !== "string" ||
    !["keyword", "semantic", "hybrid"].includes(searchType)
  ) {
    return NextResponse.json(
      { error: 'Invalid search type. Use "keyword", "semantic", or "hybrid"' },
      { status: 400 }
    );
  }
  const tags = input.tags ?? [];
  if (
    !Array.isArray(tags) ||
    tags.length > 20 ||
    !tags.every(
      (tag: unknown) =>
        typeof tag === "string" && tag.length > 0 && tag.length < 100
    )
  ) {
    return NextResponse.json(
      { error: "Tags must be up to 20 strings of 1–99 characters" },
      { status: 400 }
    );
  }
  const chunkType = input.chunkType ?? null;
  if (
    chunkType !== null &&
    (typeof chunkType !== "string" ||
      !["full-post", "section", "quote", "code"].includes(chunkType))
  ) {
    return NextResponse.json({ error: "Invalid chunk type" }, { status: 400 });
  }
  // JSON transport avoids depending on the driver's PostgreSQL array encoding.
  const tagsJson = JSON.stringify(tags);
  try {
    if (searchType === "keyword") {
      const processedQuery = prepareSearchQuery(query, "&");
      if (!processedQuery) return NextResponse.json({ results: [] });
      const results = await sql.query(
        `
        WITH RankedResults AS (
          SELECT content, post_slug, post_title, chunk_type, metadata,
            CASE
              WHEN to_tsvector('english', post_title) @@ to_tsquery('english', $1) THEN
                2.0 * ts_rank_cd(to_tsvector('english', post_title), to_tsquery('english', $1))
              ELSE
                ts_rank_cd(to_tsvector('english', content || ' ' || post_title), to_tsquery('english', $1))
            END as keyword_score,
            (to_tsvector('english', post_title) @@ to_tsquery('english', $1)) as is_title_match
          FROM content_chunks
          WHERE (to_tsvector('english', content || ' ' || post_title) @@ to_tsquery('english', $1)
            OR to_tsvector('english', post_title) @@ to_tsquery('english', $1))
            AND ($3::jsonb = '[]'::jsonb OR metadata->'tags' ?| ARRAY(SELECT jsonb_array_elements_text($3::jsonb)))
            AND ($4::text IS NULL OR chunk_type = $4::text)
        )
        SELECT content, post_slug, post_title, chunk_type, metadata, keyword_score, is_title_match
        FROM RankedResults
        ORDER BY is_title_match DESC, keyword_score DESC
        LIMIT $2
        `,
        [processedQuery, SEARCH_RESULT_LIMIT, tagsJson, chunkType]
      );

      if (results.length === 0) {
        return NextResponse.json({
          results: [],
          message: "No exact matches found for your query",
        });
      }

      return NextResponse.json({
        results: results.map((row) => mapRow(row as DbRow, "keyword")),
      });
    }

    const queryEmbedding = await getVoyageClient().embed({
      model: VOYAGE_MODEL,
      input: query,
      inputType: "document",
    });

    if (!queryEmbedding?.data?.[0]?.embedding) {
      return NextResponse.json(
        { error: "Failed to generate embedding for query" },
        { status: 500 }
      );
    }

    const formattedEmbedding = formatEmbeddingForPostgres(
      queryEmbedding.data[0].embedding
    );

    if (searchType === "hybrid") {
      const results = await sql.query(
        `
        WITH RankedResults AS (
          SELECT content, post_slug, post_title, chunk_type, metadata,
            1 - (embedding <=> $1::vector) as vector_similarity,
            ts_rank(to_tsvector('english', content || ' ' || post_title), plainto_tsquery('english', $2)) as text_rank
          FROM content_chunks
          WHERE (to_tsvector('english', content || ' ' || post_title) @@ plainto_tsquery('english', $2)
            OR 1 - (embedding <=> $1::vector) > $3)
            AND ($7::jsonb = '[]'::jsonb OR metadata->'tags' ?| ARRAY(SELECT jsonb_array_elements_text($7::jsonb)))
            AND ($8::text IS NULL OR chunk_type = $8::text)
        )
        SELECT content, post_slug, post_title, chunk_type, metadata, vector_similarity, text_rank,
          (vector_similarity * $4 + COALESCE(text_rank, 0) * $5) as hybrid_score
        FROM RankedResults ORDER BY hybrid_score DESC LIMIT $6
        `,
        [
          formattedEmbedding,
          query,
          SEMANTIC_SIMILARITY_THRESHOLD_STRICT,
          HYBRID_VECTOR_WEIGHT,
          HYBRID_KEYWORD_WEIGHT,
          SEARCH_RESULT_LIMIT,
          tagsJson,
          chunkType,
        ]
      );

      if (results.length > 0) {
        return NextResponse.json({
          results: results.map((row) => mapRow(row as DbRow, "hybrid")),
        });
      }

      const fallback = await sql.query(
        `
        WITH RankedResults AS (
          SELECT content, post_slug, post_title, chunk_type, metadata,
            1 - (embedding <=> $1::vector) as vector_similarity,
            ts_rank(to_tsvector('english', content || ' ' || post_title), plainto_tsquery('english', $2)) as text_rank
          FROM content_chunks
          WHERE ($6::jsonb = '[]'::jsonb OR metadata->'tags' ?| ARRAY(SELECT jsonb_array_elements_text($6::jsonb)))
            AND ($7::text IS NULL OR chunk_type = $7::text)
        )
        SELECT content, post_slug, post_title, chunk_type, metadata, vector_similarity, text_rank,
          (vector_similarity * $3 + COALESCE(text_rank, 0) * $4) as hybrid_score
        FROM RankedResults ORDER BY hybrid_score DESC LIMIT $5
        `,
        [
          formattedEmbedding,
          query,
          HYBRID_VECTOR_WEIGHT,
          HYBRID_KEYWORD_WEIGHT,
          SEARCH_FALLBACK_LIMIT,
          tagsJson,
          chunkType,
        ]
      );

      return NextResponse.json({
        results: fallback.map((row) => mapRow(row as DbRow, "hybrid")),
        fallback: true,
      });
    }

    const results = await sql.query(
      `
        SELECT content, post_slug, post_title, chunk_type, metadata,
          1 - (embedding <=> $1::vector) as vector_similarity
        FROM content_chunks
        WHERE 1 - (embedding <=> $1::vector) > $2
        AND ($4::jsonb = '[]'::jsonb OR metadata->'tags' ?| ARRAY(SELECT jsonb_array_elements_text($4::jsonb)))
        AND ($5::text IS NULL OR chunk_type = $5::text)
        ORDER BY vector_similarity DESC LIMIT $3
        `,
      [
        formattedEmbedding,
        SEMANTIC_SIMILARITY_THRESHOLD,
        SEARCH_RESULT_LIMIT,
        tagsJson,
        chunkType,
      ]
    );

    if (results.length > 0) {
      return NextResponse.json({
        results: results.map((row) => mapRow(row as DbRow, "semantic")),
      });
    }

    const fallback = await sql.query(
      `
        SELECT content, post_slug, post_title, chunk_type, metadata,
          1 - (embedding <=> $1::vector) as vector_similarity
        FROM content_chunks
        WHERE ($3::jsonb = '[]'::jsonb OR metadata->'tags' ?| ARRAY(SELECT jsonb_array_elements_text($3::jsonb)))
          AND ($4::text IS NULL OR chunk_type = $4::text)
        ORDER BY vector_similarity DESC LIMIT $2
        `,
      [formattedEmbedding, SEARCH_FALLBACK_LIMIT, tagsJson, chunkType]
    );

    return NextResponse.json({
      results: fallback.map((row) => mapRow(row as DbRow, "semantic")),
      fallback: true,
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      {
        error: "Search is temporarily unavailable",
      },
      { status: 500 }
    );
  }
}
