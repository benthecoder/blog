import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

// Import shared utilities and constants
import { getVoyageClient } from "@/utils/clients";
import { formatEmbeddingForPostgres } from "@/utils/embeddingUtils";
import {
  SEARCH_RESULT_LIMIT,
  SEARCH_FALLBACK_LIMIT,
  SEMANTIC_SIMILARITY_THRESHOLD,
  SEMANTIC_SIMILARITY_THRESHOLD_STRICT,
  HYBRID_VECTOR_WEIGHT,
  HYBRID_KEYWORD_WEIGHT,
  VOYAGE_MODEL,
} from "@/config/constants";

export async function POST(request: Request) {
  try {
    const client = getVoyageClient();

    console.log("Database URL:", !!process.env.POSTGRES_URL);

    const {
      query,
      searchType = "hybrid",
      tags,
      chunkType,
    } = await request.json();
    console.log(
      "Received search query:",
      query,
      "Search type:",
      searchType,
      "Tags:",
      tags,
      "Chunk type:",
      chunkType
    );

    if (!query) {
      return NextResponse.json(
        { error: "Query parameter is required" },
        { status: 400 }
      );
    }

    // Build metadata filter SQL with sanitized inputs
    // Note: While we use string interpolation for the WHERE clause, inputs are sanitized:
    // - Tags: Single quotes escaped using SQL standard ('')
    // - Chunk types: Whitelisted to alphanumeric and underscores only
    // - All main query params (embeddings, query, thresholds, limits) use proper parameterization
    const buildMetadataFilter = () => {
      const filters = [];
      if (tags && Array.isArray(tags) && tags.length > 0) {
        // Sanitize tags to prevent SQL injection (escape single quotes)
        const sanitizedTags = tags
          .map((tag: string) => String(tag).replace(/'/g, "''"))
          .filter((tag: string) => tag.length > 0 && tag.length < 100); // Max tag length

        if (sanitizedTags.length > 0) {
          const tagsFilter = sanitizedTags
            .map((tag: string) => `metadata->'tags' ? '${tag}'`)
            .join(" OR ");
          filters.push(`(${tagsFilter})`);
        }
      }
      if (chunkType && typeof chunkType === "string") {
        // Sanitize chunk_type: whitelist alphanumeric, underscores, and hyphens only
        const sanitizedChunkType = chunkType.replace(/[^a-zA-Z0-9_-]/g, "");
        if (sanitizedChunkType.length > 0 && sanitizedChunkType.length < 50) {
          filters.push(`chunk_type = '${sanitizedChunkType}'`);
        }
      }
      return filters.length > 0 ? filters.join(" AND ") : null;
    };

    const metadataFilter = buildMetadataFilter();

    // Helper function to safely prepare query for PostgreSQL ts_query
    const prepareSearchQuery = (
      input: string,
      operator: string = "&"
    ): string => {
      try {
        // Remove any special characters that could break the tsquery
        const sanitized = input.replace(/['&|!():*]/g, " ").trim();

        if (!sanitized) return "";

        // Split by whitespace and filter out empty strings
        const terms = sanitized.split(/\s+/).filter((term) => term.length > 0);

        if (terms.length === 0) return "";

        // If we have just one term, don't add operators
        if (terms.length === 1) return terms[0];

        // For multiple terms, join with the specified operator
        // Format each term as a prefix search to improve matching
        const formattedTerms = terms.map((term) => term + ":*");
        return formattedTerms.join(` ${operator} `);
      } catch (e) {
        console.error("Error preparing search query:", e);
        // Return a safe fallback
        return input.trim().replace(/['&|!():*]/g, "");
      }
    };

    if (searchType === "keyword") {
      console.log("Executing keyword search query...");

      const processedQuery = prepareSearchQuery(query, "&");

      console.log("Processed query:", processedQuery);

      const metadataWhere = metadataFilter ? ` AND (${metadataFilter})` : "";
      const results = await sql.query(
        `
        WITH RankedResults AS (
          SELECT
            content,
            post_slug,
            post_title,
            chunk_type,
            metadata,
            CASE
              WHEN to_tsvector('english', post_title) @@ to_tsquery('english', $1) THEN
                2.0 * ts_rank_cd(to_tsvector('english', post_title), to_tsquery('english', $1))
              ELSE
                ts_rank_cd(to_tsvector('english', content || ' ' || post_title), to_tsquery('english', $1))
            END as text_rank,
            (to_tsvector('english', post_title) @@ to_tsquery('english', $1)) as is_title_match
          FROM content_chunks
          WHERE
            (to_tsvector('english', content || ' ' || post_title) @@ to_tsquery('english', $1)
            OR to_tsvector('english', post_title) @@ to_tsquery('english', $1))
            ${metadataWhere}
        )
        SELECT
          content,
          post_slug,
          post_title,
          chunk_type,
          metadata,
          text_rank as keyword_score,
          is_title_match
        FROM RankedResults
        ORDER BY is_title_match DESC, keyword_score DESC
        LIMIT $2
      `,
        [processedQuery, SEARCH_RESULT_LIMIT]
      );

      console.log(`Found ${results.rows.length} keyword results`);

      if (results.rows.length === 0) {
        return NextResponse.json({
          results: [],
          message: "No exact matches found for your query",
        });
      }

      return NextResponse.json({
        results: results.rows.map((row) => ({
          content: row.content,
          post_slug: row.post_slug,
          post_title: row.post_title,
          chunk_type: row.chunk_type,
          tags: row.metadata?.tags || [],
          published_date: row.metadata?.published_date,
          similarity: Number(row.keyword_score?.toFixed(4)) || 0,
          score_type: "keyword",
          section: row.metadata?.section,
          language: row.metadata?.language,
        })),
      });
    } else {
      // Generate embedding for semantic search
      console.log("Generating embedding for semantic search...");
      const queryEmbedding = await client.embed({
        model: VOYAGE_MODEL,
        input: query,
        inputType: "document",
      });

      if (!queryEmbedding?.data?.[0]?.embedding) {
        console.error("Failed to generate embedding:", queryEmbedding);
        return NextResponse.json(
          { error: "Failed to generate embedding for query" },
          { status: 500 }
        );
      }

      const embedding = queryEmbedding.data[0].embedding;
      const formattedEmbedding = formatEmbeddingForPostgres(embedding);

      if (searchType === "hybrid") {
        console.log("Executing hybrid search query...");
        const metadataWhere = metadataFilter ? ` AND (${metadataFilter})` : "";
        const results = await sql.query(
          `
          WITH RankedResults AS (
            SELECT
              content,
              post_slug,
              post_title,
              chunk_type,
              metadata,
              1 - (embedding <=> $1::vector) as vector_similarity,
              ts_rank(
                to_tsvector('english', content || ' ' || post_title),
                plainto_tsquery('english', $2)
              ) as text_rank
            FROM content_chunks
            WHERE
              (
                to_tsvector('english', content || ' ' || post_title) @@ plainto_tsquery('english', $2)
                OR
                1 - (embedding <=> $1::vector) > $3
              )
              ${metadataWhere}
          )
          SELECT
            content,
            post_slug,
            post_title,
            chunk_type,
            metadata,
            vector_similarity,
            text_rank,
            (vector_similarity * $4 + COALESCE(text_rank, 0) * $5) as hybrid_score
          FROM RankedResults
          ORDER BY hybrid_score DESC
          LIMIT $6
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

        console.log(`Found ${results.rows.length} hybrid results`);

        if (results.rows.length === 0) {
          console.log("No results, trying fallback hybrid search...");
          const fallbackResults = await sql.query(
            `
            WITH RankedResults AS (
              SELECT
                content,
                post_slug,
                post_title,
                chunk_type,
                metadata,
                1 - (embedding <=> $1::vector) as vector_similarity,
                ts_rank(
                  to_tsvector('english', content || ' ' || post_title),
                  plainto_tsquery('english', $2)
                ) as text_rank
              FROM content_chunks
              ${metadataFilter ? `WHERE ${metadataFilter}` : ""}
            )
            SELECT
              content,
              post_slug,
              post_title,
              chunk_type,
              metadata,
              vector_similarity,
              text_rank,
              (vector_similarity * $3 + COALESCE(text_rank, 0) * $4) as hybrid_score
            FROM RankedResults
            ORDER BY hybrid_score DESC
            LIMIT $5
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
            results: fallbackResults.rows.map((row) => ({
              content: row.content,
              post_slug: row.post_slug,
              post_title: row.post_title,
              chunk_type: row.chunk_type,
              tags: row.metadata?.tags || [],
              published_date: row.metadata?.published_date,
              similarity: Number(row.hybrid_score?.toFixed(4)) || 0,
              vector_similarity: Number(row.vector_similarity?.toFixed(4)) || 0,
              keyword_score: Number(row.text_rank?.toFixed(4)) || 0,
              score_type: "hybrid",
              section: row.metadata?.section,
              language: row.metadata?.language,
            })),
            fallback: true,
          });
        }

        return NextResponse.json({
          results: results.rows.map((row) => ({
            content: row.content,
            post_slug: row.post_slug,
            post_title: row.post_title,
            chunk_type: row.chunk_type,
            tags: row.metadata?.tags || [],
            published_date: row.metadata?.published_date,
            similarity: Number(row.hybrid_score?.toFixed(4)) || 0,
            vector_similarity: Number(row.vector_similarity?.toFixed(4)) || 0,
            keyword_score: Number(row.text_rank?.toFixed(4)) || 0,
            score_type: "hybrid",
            section: row.metadata?.section,
            language: row.metadata?.language,
          })),
        });
      } else if (searchType === "semantic") {
        console.log("Executing pure semantic search query...");
        const metadataWhere = metadataFilter ? ` AND (${metadataFilter})` : "";
        const results = await sql.query(
          `
          SELECT
            content,
            post_slug,
            post_title,
            chunk_type,
            metadata,
            1 - (embedding <=> $1::vector) as vector_similarity
          FROM content_chunks
          WHERE 1 - (embedding <=> $1::vector) > $2
          ${metadataWhere}
          ORDER BY vector_similarity DESC
          LIMIT $3
        `,
          [
            formattedEmbedding,
            SEMANTIC_SIMILARITY_THRESHOLD,
            SEARCH_RESULT_LIMIT,
          ]
        );

        console.log(`Found ${results.rows.length} semantic results`);

        if (results.rows.length === 0) {
          console.log("No semantic results, trying more lenient search...");
          const fallbackResults = await sql.query(
            `
            SELECT
              content,
              post_slug,
              post_title,
              chunk_type,
              metadata,
              1 - (embedding <=> $1::vector) as vector_similarity
            FROM content_chunks
            ${metadataFilter ? `WHERE ${metadataFilter}` : ""}
            ORDER BY vector_similarity DESC
            LIMIT $2
          `,
            [formattedEmbedding, SEARCH_FALLBACK_LIMIT]
          );

          return NextResponse.json({
            results: fallbackResults.rows.map((row) => ({
              content: row.content,
              post_slug: row.post_slug,
              post_title: row.post_title,
              chunk_type: row.chunk_type,
              tags: row.metadata?.tags || [],
              published_date: row.metadata?.published_date,
              similarity: Number(row.vector_similarity?.toFixed(4)) || 0,
              score_type: "semantic",
              section: row.metadata?.section,
              language: row.metadata?.language,
            })),
            fallback: true,
          });
        }

        return NextResponse.json({
          results: results.rows.map((row) => ({
            content: row.content,
            post_slug: row.post_slug,
            post_title: row.post_title,
            chunk_type: row.chunk_type,
            tags: row.metadata?.tags || [],
            published_date: row.metadata?.published_date,
            similarity: Number(row.vector_similarity?.toFixed(4)) || 0,
            score_type: "semantic",
            section: row.metadata?.section,
            language: row.metadata?.language,
          })),
        });
      }
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
