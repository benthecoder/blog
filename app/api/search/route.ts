import { z } from "zod";
import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";
import { getSearchEmbedding } from "@/utils/searchEmbedding";
import { formatEmbeddingForPostgres } from "@/utils/chunking/embeddingUtils";
import {
  SEARCH_RESULT_LIMIT,
  SEARCH_FALLBACK_LIMIT,
  SEARCH_CANDIDATE_LIMIT,
  SEARCH_RRF_K,
  SEARCH_MAX_PER_POST,
  SEMANTIC_SIMILARITY_THRESHOLD,
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
      : // Hybrid ranks by the fused score, but shows cosine similarity: fused
        // scores aren't comparable across queries as a percentage.
        Number(row.vector_similarity?.toFixed(4)) || 0;

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
  const sanitized = input.replace(/['&|!():*<>\\]/g, " ").trim();
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
  // The database deadline starts before embedding and is shared by fallback reads.
  const queryOptions = {
    fetchOptions: {
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(20_000)]),
    },
  };
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
        [processedQuery, SEARCH_RESULT_LIMIT, tagsJson, chunkType],
        queryOptions
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
      // Reciprocal Rank Fusion of two candidate lists. Raw scores are not
      // comparable (cosine ~0.7 vs ts_rank ~0.05), ranks are.
      //  vec: nearest chunks by cosine distance (ORDER BY + LIMIT lets the
      //       pgvector index work; no similarity threshold).
      //  kw:  chunks matching the query via websearch_to_tsquery, title
      //       matches first, then ts_rank_cd. The tsvector expression matches
      //       the existing GIN index.
      // fused = sum of 1/(k+rank) over the lists a chunk is in, plus one
      // top-rank contribution when the post title matches the query, so exact
      // titles land first. `similarity` is the fused score divided by its
      // maximum (rank 1 in both lists + title bonus = 3/(k+1)), so it stays in
      // 0-1 and agrees with the ordering shown. At most $6 chunks per post.
      // Only fixed SQL varies; all input values are parameters.
      const results = await sql.query(
        `
        WITH vec AS (
          SELECT id, ROW_NUMBER() OVER (ORDER BY dist) AS rnk
          FROM (
            SELECT id, embedding <=> $1::vector AS dist
            FROM content_chunks
            WHERE ($7::jsonb = '[]'::jsonb OR metadata->'tags' ?| ARRAY(SELECT jsonb_array_elements_text($7::jsonb)))
              AND ($8::text IS NULL OR chunk_type = $8::text)
            ORDER BY embedding <=> $1::vector
            LIMIT $3::int
          ) nearest
        ),
        kw AS (
          SELECT id, title_match, text_rank,
            ROW_NUMBER() OVER (ORDER BY title_match DESC, text_rank DESC) AS rnk
          FROM (
            SELECT c.id,
              to_tsvector('english', c.post_title) @@ q.tsq AS title_match,
              ts_rank_cd(to_tsvector('english', c.content || ' ' || c.post_title), q.tsq) AS text_rank
            FROM content_chunks c, (SELECT websearch_to_tsquery('english', $2) AS tsq) q
            WHERE to_tsvector('english', c.content || ' ' || c.post_title) @@ q.tsq
              -- A negation-only query ("-foo") matches nearly every row at rank 0.
              AND ts_rank_cd(to_tsvector('english', c.content || ' ' || c.post_title), q.tsq) > 0
              AND ($7::jsonb = '[]'::jsonb OR c.metadata->'tags' ?| ARRAY(SELECT jsonb_array_elements_text($7::jsonb)))
              AND ($8::text IS NULL OR c.chunk_type = $8::text)
            ORDER BY title_match DESC, text_rank DESC
            LIMIT $3::int
          ) matches
        ),
        fused AS (
          SELECT COALESCE(vec.id, kw.id) AS id,
            COALESCE(1.0 / ($4::int + vec.rnk), 0)
              + COALESCE(1.0 / ($4::int + kw.rnk), 0)
              + CASE WHEN kw.title_match THEN 1.0 / ($4::int + 1) ELSE 0 END AS rrf,
            COALESCE(kw.text_rank, 0) AS text_rank
          FROM vec FULL JOIN kw ON vec.id = kw.id
        ),
        capped AS (
          SELECT c.content, c.post_slug, c.post_title, c.chunk_type, c.metadata,
            1 - (c.embedding <=> $1::vector) AS vector_similarity,
            f.text_rank,
            (f.rrf * ($4::int + 1) / 3.0)::float8 AS hybrid_score,
            ROW_NUMBER() OVER (PARTITION BY c.post_slug ORDER BY f.rrf DESC) AS post_rank
          FROM fused f JOIN content_chunks c ON c.id = f.id
        )
        SELECT content, post_slug, post_title, chunk_type, metadata,
          vector_similarity, text_rank, hybrid_score
        FROM capped
        WHERE post_rank <= $6::int
        ORDER BY hybrid_score DESC
        LIMIT $5::int
        `,
        [
          formattedEmbedding,
          query,
          SEARCH_CANDIDATE_LIMIT,
          SEARCH_RRF_K,
          SEARCH_RESULT_LIMIT,
          SEARCH_MAX_PER_POST,
          tagsJson,
          chunkType,
        ],
        queryOptions
      );

      return NextResponse.json({
        results: results.map((row) => mapRow(row as DbRow, "hybrid")),
      });
    }

    // Semantic: nearest candidates (index-friendly), then threshold and the
    // per-post cap on the small candidate set.
    const results = await sql.query(
      `
        SELECT content, post_slug, post_title, chunk_type, metadata, vector_similarity
        FROM (
          SELECT content, post_slug, post_title, chunk_type, metadata, vector_similarity,
            ROW_NUMBER() OVER (PARTITION BY post_slug ORDER BY vector_similarity DESC) AS post_rank
          FROM (
            SELECT content, post_slug, post_title, chunk_type, metadata,
              1 - (embedding <=> $1::vector) AS vector_similarity
            FROM content_chunks
            WHERE ($6::jsonb = '[]'::jsonb OR metadata->'tags' ?| ARRAY(SELECT jsonb_array_elements_text($6::jsonb)))
              AND ($7::text IS NULL OR chunk_type = $7::text)
            ORDER BY embedding <=> $1::vector
            LIMIT $5::int
          ) nearest
          WHERE vector_similarity > $2
        ) capped
        WHERE post_rank <= $4::int
        ORDER BY vector_similarity DESC LIMIT $3::int
        `,
      [
        formattedEmbedding,
        SEMANTIC_SIMILARITY_THRESHOLD,
        SEARCH_RESULT_LIMIT,
        SEARCH_MAX_PER_POST,
        SEARCH_CANDIDATE_LIMIT,
        tagsJson,
        chunkType,
      ],
      queryOptions
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
      [formattedEmbedding, SEARCH_FALLBACK_LIMIT, tagsJson, chunkType],
      queryOptions
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
