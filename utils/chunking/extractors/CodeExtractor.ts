/**
 * Code Extractor
 *
 * Extracts code blocks from posts.
 * Rare (only 2.5% of posts) but valuable for technical search.
 *
 * Code blocks are naturally well-bounded semantic units.
 */

import { Node } from "unist";
import { visit } from "unist-util-visit";
import { ChunkExtractor, ChunkContext, ProcessedChunk } from "@/types/chunks";

export class CodeExtractor implements ChunkExtractor {
  readonly chunkType = "code" as const;

  process(tree: Node, context: ChunkContext): ProcessedChunk[] {
    const chunks: ProcessedChunk[] = [];
    let sequence = 200; // Start code blocks at 200

    visit(tree, "code", (node: any) => {
      const codeText = node.value?.trim();

      if (codeText && codeText.length > 0) {
        chunks.push({
          type: this.chunkType,
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
}
