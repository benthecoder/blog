import type { Root } from "mdast";
import type { ChunkContext, ProcessedChunk } from "@/types/chunks";
import { MAX_WHOLE_POST_LENGTH } from "@/config/constants";

export function extractFullPost(
  _tree: Root,
  context: ChunkContext
): ProcessedChunk[] {
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
      type: "full-post",
      content: fullContent,
      metadata: {
        wordCount: fullContent.trim().split(/\s+/).length,
      },
      sequence: 0, // Full-post is always first
    },
  ];
}
