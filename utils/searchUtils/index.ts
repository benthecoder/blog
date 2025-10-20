import { sql } from "@vercel/postgres";
import { VoyageAIClient } from "voyageai";
import { Anthropic } from "@anthropic-ai/sdk";

// Import shared utilities
import { formatEmbeddingForPostgres } from "@/utils/embeddingUtils";
import { toISODateString } from "@/utils/dateUtils";
import {
  CHAT_SIMILARITY_THRESHOLD,
  TIME_QUERY_LIMIT,
  CLAUDE_CHAT_MODEL,
  CLAUDE_DATE_EXTRACTION_MAX_TOKENS,
  CLAUDE_DATE_EXTRACTION_TEMPERATURE,
  VOYAGE_MODEL,
} from "@/config/constants";

/**
 * Extract date references from a user query using Claude
 */
export async function extractDatesWithLLM(
  query: string,
  currentDate: Date,
  anthropic: Anthropic
) {
  const response = await anthropic.messages.create({
    model: CLAUDE_CHAT_MODEL,
    max_tokens: CLAUDE_DATE_EXTRACTION_MAX_TOKENS,
    temperature: CLAUDE_DATE_EXTRACTION_TEMPERATURE,
    system:
      "You are a date extraction tool. Extract any date references from the user's query. Return ONLY a JSON object with these fields: hasDateReference (boolean), startDate (ISO string or null), endDate (ISO string or null), query (the non-date part of the query, or null if there's no specific topic). Do not include markdown formatting, code blocks, or any explanatory text.",
    messages: [
      {
        role: "user",
        content: `Extract date information from this query: "${query}". Today's date is ${toISODateString(
          currentDate
        )}.`,
      },
    ],
  });

  try {
    // Parse the JSON response - safely access content
    const contentBlock = response.content[0];
    // Cast to any to handle different API versions
    const anyBlock = contentBlock as any;

    // Check for text property
    let contentText = "";

    if ("text" in anyBlock) {
      contentText = anyBlock.text;
    } else if (anyBlock.type === "text" && "text" in anyBlock) {
      // For newer Anthropic API versions
      contentText = anyBlock.text;
    } else {
      // Fallback for other content types
      contentText = JSON.stringify(anyBlock);
      console.warn("Unexpected content block format:", anyBlock);
    }

    // Remove any markdown code block formatting if present
    contentText = contentText.replace(/```json\n|\n```|```/g, "");

    // Trim any whitespace
    contentText = contentText.trim();

    const dateInfo = JSON.parse(contentText);

    // Convert string dates to Date objects if present
    if (dateInfo.startDate) dateInfo.startDate = new Date(dateInfo.startDate);
    if (dateInfo.endDate) dateInfo.endDate = new Date(dateInfo.endDate);

    return dateInfo;
  } catch (error) {
    console.error("Error parsing date extraction response:", error);
    // Safely log the content
    const contentBlock = response.content[0];
    const anyBlock = contentBlock as any;
    const contentText =
      "text" in anyBlock ? anyBlock.text : "Content unavailable";
    console.log("Raw response:", contentText);
    // Return default object if parsing fails
    return {
      hasDateReference: false,
      startDate: null,
      endDate: null,
      query: query,
    };
  }
}

/**
 * Format description of the user's time-based intent
 */
export function describeDateIntent(dateInfo: any): string {
  if (!dateInfo.hasDateReference) return "";

  const startDateStr = dateInfo.startDate
    ? dateInfo.startDate.toLocaleDateString()
    : "";
  const endDateStr = dateInfo.endDate
    ? dateInfo.endDate.toLocaleDateString()
    : "";

  let timeframe = "";
  if (startDateStr && endDateStr && startDateStr !== endDateStr) {
    timeframe = `content from ${startDateStr} to ${endDateStr}`;
  } else if (startDateStr) {
    timeframe = `content from ${startDateStr}`;
  }

  const topic = dateInfo.query ? ` about "${dateInfo.query}"` : "";

  return `${timeframe}${topic}`;
}

/**
 * Perform standard semantic search using vector similarity
 */
export async function performSemanticSearch(
  query: string,
  voyageClient: VoyageAIClient
) {
  // Generate embedding for query
  const queryEmbedding = await voyageClient.embed({
    model: VOYAGE_MODEL,
    input: query,
    inputType: "document",
  });

  if (!queryEmbedding?.data?.[0]?.embedding) {
    throw new Error("Failed to generate embedding for query");
  }

  const embedding = queryEmbedding.data[0].embedding;
  const formattedEmbedding = formatEmbeddingForPostgres(embedding);

  // Simplified search to isolate potential issues
  // Using direct vector similarity with a lower threshold
  try {
    console.log("Running simplified semantic search...");

    // First, try a simple query to check if the table exists and has data
    const tableCheck = await sql`SELECT COUNT(*) as count FROM content_chunks;`;
    console.log(
      `Table check: ${tableCheck.rows[0]?.count || 0} total chunks found`
    );

    // Use simple vector search with lower threshold
    return await sql`
      SELECT
        content,
        post_slug,
        post_title,
        metadata->>'published_date' as published_date,
        metadata->>'tags' as tags,
        chunk_type,
        1 - (embedding <=> ${formattedEmbedding}::vector) as similarity
      FROM content_chunks
      WHERE 1 - (embedding <=> ${formattedEmbedding}::vector) > ${CHAT_SIMILARITY_THRESHOLD}
      ORDER BY similarity DESC
      LIMIT 15;
    `;
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}

/**
 * Execute a time-based query with optional semantic filtering
 */
export async function executeTimeBasedQuery(
  dateInfo: any,
  voyageClient: VoyageAIClient
) {
  if (!dateInfo.hasDateReference || !dateInfo.startDate) {
    throw new Error("Invalid date information for time-based query");
  }

  // Format dates for SQL query
  const startDateStr = toISODateString(dateInfo.startDate);
  const endDateStr = dateInfo.endDate
    ? toISODateString(dateInfo.endDate)
    : startDateStr;

  console.log(
    `Executing time-based query from ${startDateStr} to ${endDateStr}`
  );

  // For time-based queries, we'll retrieve by date first, then do semantic filtering if needed
  if (dateInfo.query) {
    // If we have both time and a specific query, perform a hybrid search
    const queryEmbedding = await voyageClient.embed({
      model: VOYAGE_MODEL,
      input: dateInfo.query,
      inputType: "document",
    });

    if (!queryEmbedding?.data?.[0]?.embedding) {
      throw new Error("Failed to generate embedding for query");
    }

    const embedding = queryEmbedding.data[0].embedding;
    const formattedEmbedding = formatEmbeddingForPostgres(embedding);

    // Simplified search for debugging
    try {
      console.log("Running simplified date-based search...");

      // First, check if we have any date-based data
      const dateCheck = await sql`
        SELECT COUNT(*) as count 
        FROM content_chunks 
        WHERE metadata->>'published_date' BETWEEN ${startDateStr} AND ${endDateStr};
      `;
      console.log(
        `Date check: ${dateCheck.rows[0]?.count || 0} chunks found in date range`
      );

      // Use simpler query with existing metadata field instead of dedicated column
      return await sql`
        SELECT
          content,
          post_slug,
          post_title,
          metadata->>'published_date' as published_date,
          metadata->>'tags' as tags,
          chunk_type,
          1 - (embedding <=> ${formattedEmbedding}::vector) as similarity
        FROM content_chunks
        WHERE
          metadata->>'published_date' BETWEEN ${startDateStr} AND ${endDateStr}
          AND 1 - (embedding <=> ${formattedEmbedding}::vector) > ${CHAT_SIMILARITY_THRESHOLD}
        ORDER BY similarity DESC
        LIMIT ${TIME_QUERY_LIMIT};
      `;
    } catch (error) {
      console.error("Date-based query error:", error);
      throw error;
    }
  } else {
    // Simplified pure date-based query for debugging
    try {
      console.log("Running pure date-based search...");

      // Simple query using metadata fields
      return await sql`
        SELECT
          content,
          post_slug,
          post_title,
          metadata->>'published_date' as published_date,
          metadata->>'tags' as tags,
          chunk_type,
          1 as similarity
        FROM content_chunks
        WHERE metadata->>'published_date' BETWEEN ${startDateStr} AND ${endDateStr}
        ORDER BY (metadata->>'published_date') DESC
        LIMIT 15;
      `;
    } catch (error) {
      console.error("Pure date query error:", error);
      throw error;
    }
  }
}
