/**
 * Embedding utilities for vector operations
 * Consolidates embedding formatting and generation logic
 */

import { getVoyageClient } from "./clients";
import { VOYAGE_MODEL, VOYAGE_INPUT_TYPE } from "@/config/constants";

/**
 * Format an embedding array for PostgreSQL vector storage
 * Converts number[] to PostgreSQL vector format: [1.23,4.56,...]
 *
 * @param embedding - Array of embedding values
 * @returns Formatted string for PostgreSQL vector column
 */
export function formatEmbeddingForPostgres(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}

/**
 * Generate an embedding for a single text input using VoyageAI
 *
 * @param text - Text to generate embedding for
 * @param inputType - Type of input ('document' or 'query')
 * @returns Embedding vector as number array
 */
export async function generateEmbedding(
  text: string,
  inputType: "document" | "query" = "document"
): Promise<number[]> {
  const client = getVoyageClient();

  const response = await client.embed({
    model: VOYAGE_MODEL,
    input: text,
    inputType,
  });

  if (!response?.data?.[0]?.embedding) {
    throw new Error("Failed to generate embedding");
  }

  return response.data[0].embedding;
}

/**
 * Generate embeddings for multiple texts in a single batch
 *
 * @param texts - Array of texts to generate embeddings for
 * @param inputType - Type of input ('document' or 'query')
 * @returns Array of embedding vectors
 */
export async function generateEmbeddingsBatch(
  texts: string[],
  inputType: "document" | "query" = "document"
): Promise<number[][]> {
  const client = getVoyageClient();

  const response = await client.embed({
    model: VOYAGE_MODEL,
    input: texts,
    inputType,
  });

  if (!response?.data?.length) {
    throw new Error("Failed to generate embeddings");
  }

  return response.data
    .map((item) => item.embedding)
    .filter((emb): emb is number[] => emb !== undefined);
}

/**
 * Generate an embedding and format it for PostgreSQL in one step
 *
 * @param text - Text to generate embedding for
 * @param inputType - Type of input ('document' or 'query')
 * @returns Formatted embedding string for PostgreSQL
 */
export async function generateAndFormatEmbedding(
  text: string,
  inputType: "document" | "query" = "document"
): Promise<string> {
  const embedding = await generateEmbedding(text, inputType);
  return formatEmbeddingForPostgres(embedding);
}
