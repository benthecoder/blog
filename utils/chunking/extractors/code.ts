import type { Root } from "mdast";
import type { ChunkContext, ProcessedChunk } from "@/types/chunks";
import { visit } from "unist-util-visit";

export function extractCode(
  tree: Root,
  context: ChunkContext
): ProcessedChunk[] {
  const chunks: ProcessedChunk[] = [];
  let sequence = 200; // Start code blocks at 200

  visit(tree, "code", (node) => {
    const codeText = node.value.trim();

    if (codeText && codeText.length > 0) {
      chunks.push({
        type: "code",
        content: codeText,
        metadata: {
          language: node.lang || "unknown",
          section: context.currentSection,
          wordCount: codeText.trim().split(/\s+/).length,
        },
        sequence: sequence++,
      });
    }
  });

  return chunks;
}
