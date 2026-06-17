import { sql } from "@vercel/postgres";
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

function buildMetadataFilter(tags: unknown, chunkType: unknown): string | null {
  const filters: string[] = [];

  if (Array.isArray(tags) && tags.length > 0) {
    const sanitized = tags
      .map((tag) => String(tag).replace(/'/g, "''"))
      .filter((tag) => tag.length > 0 && tag.length < 100);
    if (sanitized.length > 0) {
      filters.push(
        `(${sanitized.map((tag) => `metadata->'tags' ? '${tag}'`).join(" OR ")})`
      );
    }
  }

  if (typeof chunkType === "string") {
    const safe = chunkType.replace(/[^a-zA-Z0-9_-]/g, "");
    if (safe.length > 0 && safe.length < 50) {
      filters.push(`chunk_type = '${safe}'`);
    }
  }

  return filters.length > 0 ? filters.join(" AND ") : null;
}

function prepareSearchQuery(input: string, operator = "&"): string {
  const sanitized = input.replace(/['&|!():*]/g, " ").trim();
  const terms = sanitized.split(/\s+/).filter(Boolean);
  if (terms.length === 0) return "";
  if (terms.length === 1) return terms[0];
  return terms.map((t) => t + ":*").join(` ${operator} `);
}

export async function POST(request: Request) {
  try {
    const client = getVoyageClient();
    const {
      query,
      searchType = "hybrid",
      tags,
      chunkType,
    } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: "Query parameter is required" },
        { status: 400 }
      );
    }

    const metadataFilter = buildMetadataFilter(tags, chunkType);
    const metadataWhere = metadataFilter ? ` AND (${metadataFilter})` : "";

    if (searchType === "keyword") {
      const processedQuery = prepareSearchQuery(query, "&");
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
            ${metadataWhere}
        )
        SELECT content, post_slug, post_title, chunk_type, metadata, keyword_score, is_title_match
        FROM RankedResults
        ORDER BY is_title_match DESC, keyword_score DESC
        LIMIT $2
        `,
        [processedQuery, SEARCH_RESULT_LIMIT]
      );

      if (results.rows.length === 0) {
        return NextResponse.json({
          results: [],
          message: "No exact matches found for your query",
        });
      }

      return NextResponse.json({
        results: results.rows.map((row) => mapRow(row, "keyword")),
      });
    }

    const queryEmbedding = await client.embed({
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
            ${metadataWhere}
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
        ]
      );

      if (results.rows.length > 0) {
        return NextResponse.json({
          results: results.rows.map((row) => mapRow(row, "hybrid")),
        });
      }

      const fallback = await sql.query(
        `
        WITH RankedResults AS (
          SELECT content, post_slug, post_title, chunk_type, metadata,
            1 - (embedding <=> $1::vector) as vector_similarity,
            ts_rank(to_tsvector('english', content || ' ' || post_title), plainto_tsquery('english', $2)) as text_rank
          FROM content_chunks
          ${metadataFilter ? `WHERE ${metadataFilter}` : ""}
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
        ]
      );

      return NextResponse.json({
        results: fallback.rows.map((row) => mapRow(row, "hybrid")),
        fallback: true,
      });
    }

    if (searchType === "semantic") {
      const results = await sql.query(
        `
        SELECT content, post_slug, post_title, chunk_type, metadata,
          1 - (embedding <=> $1::vector) as vector_similarity
        FROM content_chunks
        WHERE 1 - (embedding <=> $1::vector) > $2
        ${metadataWhere}
        ORDER BY vector_similarity DESC LIMIT $3
        `,
        [formattedEmbedding, SEMANTIC_SIMILARITY_THRESHOLD, SEARCH_RESULT_LIMIT]
      );

      if (results.rows.length > 0) {
        return NextResponse.json({
          results: results.rows.map((row) => mapRow(row, "semantic")),
        });
      }

      const fallback = await sql.query(
        `
        SELECT content, post_slug, post_title, chunk_type, metadata,
          1 - (embedding <=> $1::vector) as vector_similarity
        FROM content_chunks
        ${metadataFilter ? `WHERE ${metadataFilter}` : ""}
        ORDER BY vector_similarity DESC LIMIT $2
        `,
        [formattedEmbedding, SEARCH_FALLBACK_LIMIT]
      );

      return NextResponse.json({
        results: fallback.rows.map((row) => mapRow(row, "semantic")),
        fallback: true,
      });
    }

    return NextResponse.json(
      { error: 'Invalid search type. Use "keyword", "semantic", or "hybrid"' },
      { status: 400 }
    );
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
        details: process.env.NODE_ENV === "development" ? error : undefined,
      },
      { status: 500 }
    );
  }
}
