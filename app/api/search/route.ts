import { z } from "zod";
import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";
import { getSearchEmbedding } from "@/utils/searchEmbedding";
import { formatEmbeddingForPostgres } from "@/utils/chunking/embeddingUtils";
import {
  SEARCH_RESULT_LIMIT,
  SEARCH_FALLBACK_LIMIT,
  SEMANTIC_SIMILARITY_THRESHOLD,
  SEMANTIC_SIMILARITY_THRESHOLD_STRICT,
  HYBRID_VECTOR_WEIGHT,
  HYBRID_KEYWORD_WEIGHT,
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

const searchRequestSchema = z.object({
  query: z
    .string()
    .max(2000)
    .refine((query) => query.trim().length > 0)
    .transform((query) => query.trim()),
  searchType: z
    .enum(["keyword", "semantic", "hybrid"])
    .nullish()
    .transform((value) => value ?? "hybrid"),
  // Reject oversized arrays before Zod traverses their elements.
  tags: z
    .custom<unknown[]>((value) => Array.isArray(value) && value.length <= 20)
    .pipe(z.array(z.string().min(1).max(99)))
    .nullish()
    .transform((value) => value ?? []),
  chunkType: z
    .enum(["full-post", "section", "quote", "code"])
    .nullish()
    .transform((value) => value ?? null),
});
const searchValidationErrors: Record<string, string> = {
  query: "Query must contain 1–2000 characters",
  searchType: 'Invalid search type. Use "keyword", "semantic", or "hybrid"',
  tags: "Tags must be up to 20 strings of 1–99 characters",
  chunkType: "Invalid chunk type",
};

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = searchRequestSchema.safeParse(body);
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    return NextResponse.json(
      {
        error:
          typeof field === "string"
            ? searchValidationErrors[field]
            : "Expected a search request",
      },
      { status: 400 }
    );
  }
  const { query, searchType, tags, chunkType } = parsed.data;
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

    const formattedEmbedding = formatEmbeddingForPostgres(
      await getSearchEmbedding(query)
    );

    if (searchType === "hybrid") {
      // Split the unfiltered text/vector OR so text matching can use its GIN
      // index. Selective tag filters already prune cheaply with the old plan.
      // Only fixed SQL fragments vary here; all input values remain parameters.
      const results = await sql.query(
        `
        WITH RankedResults AS (
          SELECT content, post_slug, post_title, chunk_type, metadata,
            1 - (embedding <=> $1::vector) as vector_similarity,
            ts_rank(to_tsvector('english', content || ' ' || post_title), plainto_tsquery('english', $2)) as text_rank
          FROM content_chunks
          WHERE ${
            tags.length
              ? `(to_tsvector('english', content || ' ' || post_title) @@ plainto_tsquery('english', $2)
                  OR 1 - (embedding <=> $1::vector) > $3)`
              : `id IN (
                  SELECT id FROM content_chunks
                  WHERE to_tsvector('english', content || ' ' || post_title) @@ plainto_tsquery('english', $2)
                    AND ($8::text IS NULL OR chunk_type = $8::text)
                  UNION
                  SELECT id FROM content_chunks
                  WHERE 1 - (embedding <=> $1::vector) > $3
                    AND ($8::text IS NULL OR chunk_type = $8::text)
                )`
          }
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
