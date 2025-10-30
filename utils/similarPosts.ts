/**
 * Similar Posts Recommendation
 *
 * Finds semantically similar posts using full-post embeddings.
 *
 * Previous approach (BROKEN):
 * - Averaged all chunk embeddings to get post-level embedding
 * - N+1 query pattern (slow)
 * - Manual cosine similarity calculation
 *
 * New approach (CORRECT):
 * - Uses full-post chunk embeddings directly
 * - Single SQL query with pgvector's built-in distance
 * - Fast and mathematically sound
 */

import { sql } from "@vercel/postgres";
import getPostMetadata from "./getPostMetadata";

export interface SimilarPost {
  slug: string;
  title: string;
  date: string;
  similarity: number;
}

/**
 * Find posts most similar to the given post using vector similarity
 *
 * @param slug - The slug of the current post
 * @param limit - Maximum number of similar posts to return (default: 5)
 * @returns Array of similar posts with metadata and similarity scores
 */
export async function getSimilarPosts(
  slug: string,
  limit: number = 5
): Promise<SimilarPost[]> {
  try {
    // Get the full-post embedding for the current post
    const currentPost = await sql`
      SELECT embedding
      FROM content_chunks
      WHERE post_slug = ${slug}
        AND chunk_type = 'full-post'
        AND embedding IS NOT NULL
      LIMIT 1
    `;

    if (currentPost.rows.length === 0) {
      console.warn(`No full-post embedding found for: ${slug}`);
      return [];
    }

    const currentEmbedding = currentPost.rows[0].embedding;

    // Find similar posts using pgvector's cosine distance operator (<=>)
    // Lower distance = more similar
    const similarPosts = await sql`
      SELECT
        post_slug,
        post_title,
        (metadata->>'published_date')::text as published_date,
        1 - (embedding <=> ${currentEmbedding}::vector) as similarity
      FROM content_chunks
      WHERE chunk_type = 'full-post'
        AND post_slug != ${slug}
        AND embedding IS NOT NULL
      ORDER BY embedding <=> ${currentEmbedding}::vector
      LIMIT ${limit}
    `;

    // Enrich with metadata from filesystem (for proper date formatting)
    const allPosts = getPostMetadata();
    const postsMap = new Map(allPosts.map((p) => [p.slug, p]));

    const results: SimilarPost[] = similarPosts.rows
      .map((row) => {
        const post = postsMap.get(row.post_slug);
        if (!post) return null;

        return {
          slug: row.post_slug,
          title: row.post_title,
          date: post.date,
          similarity: parseFloat(row.similarity),
        };
      })
      .filter((post): post is SimilarPost => post !== null);

    return results;
  } catch (error) {
    console.error("Error fetching similar posts:", error);
    return [];
  }
}
