/**
 * Quote Extractor
 *
 * Extracts all block quotes from posts.
 * Quotes are valuable for philosophy/wisdom search.
 *
 * We keep ALL quotes, even short ones, because:
 * - "Be water" is profound despite being 2 words
 * - Philosophy is often concise
 * - Users specifically search for quotes
 */

import { Node } from "unist";
import { visit } from "unist-util-visit";
import {
  ChunkExtractor,
  ChunkContext,
  MdNode,
  ProcessedChunk,
} from "@/types/chunks";
import { MIN_QUOTE_LENGTH } from "@/config/constants";

export class QuoteExtractor implements ChunkExtractor {
  readonly chunkType = "quote" as const;

  process(tree: Node, context: ChunkContext): ProcessedChunk[] {
    const chunks: ProcessedChunk[] = [];
    let sequence = 100; // Start quotes at 100 to leave room for sections

    visit(tree, "blockquote", (node: MdNode) => {
      const quoteText = this.extractQuoteText(node);

      // Keep quotes above minimum length
      if (quoteText && quoteText.length >= MIN_QUOTE_LENGTH) {
        chunks.push({
          type: this.chunkType,
          content: quoteText,
          metadata: {
            section: context.currentSection,
            wordCount: quoteText.trim().split(/\s+/).length,
          },
          sequence: sequence++,
        });
      }
    });

    return chunks;
  }

  private extractQuoteText(blockquoteNode: MdNode): string {
    const texts: string[] = [];

    // Recursively extract all text from quote
    const extractText = (node: MdNode): void => {
      if (node.type === "text" && node.value) {
        texts.push(node.value);
      } else if (node.children) {
        node.children.forEach(extractText);
      }
    };

    extractText(blockquoteNode);

    return texts.join(" ").replace(/\s+/g, " ").trim();
  }
}
