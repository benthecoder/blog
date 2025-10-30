/**
 * Full Post Extractor
 *
 * Creates a single chunk for the entire post content.
 * This is the primary embedding used for:
 * - Similar posts feature
 * - General semantic search
 * - Post-level understanding
 */

import { Node } from "unist";
import { ChunkExtractor, ChunkContext, ProcessedChunk } from "@/types/chunks";
import { MAX_WHOLE_POST_LENGTH } from "@/config/constants";

export class FullPostExtractor implements ChunkExtractor {
  readonly chunkType = "full-post" as const;

  process(_tree: Node, context: ChunkContext): ProcessedChunk[] {
    const { fullContent, slug } = context;

    // Only create full-post chunk if content isn't too long
    // (VoyageAI has context limits, and very long posts are better chunked)
    if (fullContent.length > MAX_WHOLE_POST_LENGTH) {
      console.warn(
        `Post ${slug} is ${fullContent.length} chars, skipping full-post chunk`
      );
      return [];
    }

    return [
      {
        type: this.chunkType,
        content: fullContent,
        metadata: {
          wordCount: fullContent.trim().split(/\s+/).length,
        },
        sequence: 0, // Full-post is always first
      },
    ];
  }
}
