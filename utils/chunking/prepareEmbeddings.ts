import { randomUUID } from "node:crypto";
import type { EmbedResponse } from "voyageai";
import type { ProcessedPost } from "@/types/chunks";
import { extractPostDate, toISODateString } from "@/utils/dateUtils";
import { extractTags } from "@/utils/content/tags";
import { formatEmbeddingForPostgres } from "./embeddingUtils";

export interface EmbeddingRow {
  id: string;
  post_slug: string;
  post_title: string;
  content: string;
  chunk_type: string;
  metadata: Record<string, unknown>;
  sequence: number;
  embedding: string;
  published_date: string;
  tags: string[];
}

/** Prepare the complete replacement without touching the database. */
export async function prepareEmbeddings(
  posts: ProcessedPost[],
  embed: (texts: string[]) => Promise<EmbedResponse>,
  batchSize: number,
  betweenBatches: () => Promise<void>
): Promise<EmbeddingRow[]> {
  if (!Number.isInteger(batchSize) || batchSize < 1) {
    throw new Error("Invalid embedding batch size");
  }
  if (
    posts.length === 0 ||
    new Set(posts.map((p) => p.filePath)).size !== posts.length
  ) {
    throw new Error("Expected a nonempty set of unique published posts");
  }
  const pending = posts.flatMap((post) => {
    if (!post.chunks.some((chunk) => chunk.content.trim())) {
      throw new Error(
        `Post ${post.filePath} has no embeddable chunks; existing index preserved`
      );
    }
    const publishedDate = toISODateString(
      extractPostDate(post.filePath, post.frontmatter)
    );
    const tags = extractTags(post.frontmatter);
    return post.chunks.map((chunk) => ({ post, chunk, publishedDate, tags }));
  });
  const rows: EmbeddingRow[] = [];
  for (let start = 0; start < pending.length; start += batchSize) {
    const batch = pending.slice(start, start + batchSize);
    const response = await embed(
      batch.map(({ chunk }) => {
        const section = chunk.metadata?.section
          ? `[SECTION: ${chunk.metadata.section}] `
          : "";
        return `${chunk.type.toUpperCase()}: ${section}${chunk.content.trim()}`;
      })
    );
    if (response.data?.length !== batch.length) {
      throw new Error(
        "Embedding response count does not match requested chunks"
      );
    }
    const indexed = response.data.some((item) => item.index !== undefined);
    const vectors = new Map<number, number[]>();
    response.data.forEach((item, position) => {
      const index = indexed ? item.index : position;
      if (
        index === undefined ||
        !Number.isInteger(index) ||
        index < 0 ||
        index >= batch.length ||
        vectors.has(index)
      ) {
        throw new Error("Invalid or duplicate embedding response index");
      }
      if (
        !Array.isArray(item.embedding) ||
        item.embedding.length !== 1024 ||
        !item.embedding.every(Number.isFinite)
      ) {
        throw new Error("Expected a finite 1024-dimensional embedding");
      }
      vectors.set(index, item.embedding);
    });
    batch.forEach(({ post, chunk, publishedDate, tags }, index) => {
      const title = post.frontmatter.title || post.filePath;
      rows.push({
        id: randomUUID(),
        post_slug: post.filePath,
        post_title: title,
        content: chunk.content,
        chunk_type: chunk.type,
        sequence: chunk.sequence,
        embedding: formatEmbeddingForPostgres(vectors.get(index)!),
        published_date: publishedDate,
        tags,
        metadata: {
          ...chunk.metadata,
          post_title: title,
          published_date: publishedDate,
          tags,
        },
      });
    });
    if (start + batchSize < pending.length) await betweenBatches();
  }
  return rows;
}
