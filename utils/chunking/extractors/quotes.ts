import type { Root, Blockquote, Nodes } from "mdast";
import type { ChunkContext, ProcessedChunk } from "@/types/chunks";
import { visit } from "unist-util-visit";
import { MIN_QUOTE_LENGTH } from "@/config/constants";

export function extractQuotes(
  tree: Root,
  context: ChunkContext
): ProcessedChunk[] {
  const chunks: ProcessedChunk[] = [];
  let sequence = 100; // Start quotes at 100 to leave room for sections

  visit(tree, "blockquote", (node) => {
    const quoteText = extractQuoteText(node);

    // Keep quotes above minimum length
    if (quoteText && quoteText.length >= MIN_QUOTE_LENGTH) {
      chunks.push({
        type: "quote",
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

function extractQuoteText(blockquoteNode: Blockquote): string {
  const texts: string[] = [];

  // Recursively extract all text from quote
  const extractText = (node: Nodes): void => {
    if (node.type === "text" && node.value) {
      texts.push(node.value);
    } else if ("children" in node) {
      node.children.forEach(extractText);
    }
  };

  extractText(blockquoteNode);

  return texts.join(" ").replace(/\s+/g, " ").trim();
}
