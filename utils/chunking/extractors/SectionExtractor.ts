/**
 * Section Extractor
 *
 * Extracts heading + following content as semantic units.
 * Only applies to structured posts (with 3+ headings).
 *
 * Examples:
 * - Book reviews with chapter-like sections
 * - Advice posts with topic breakdowns
 * - Study notes organized by concept
 */

import { Node } from "unist";
import { visit } from "unist-util-visit";
import { ChunkExtractor, ChunkContext, ProcessedChunk } from "@/types/chunks";
import { MIN_SECTION_LENGTH } from "@/config/constants";

export class SectionExtractor implements ChunkExtractor {
  readonly chunkType = "section" as const;

  process(tree: Node, context: ChunkContext): ProcessedChunk[] {
    const chunks: ProcessedChunk[] = [];
    const sections: Array<{
      heading: string;
      level: number;
      content: string[];
    }> = [];

    let currentSection: {
      heading: string;
      level: number;
      content: string[];
    } | null = null;

    visit(tree, (node: any) => {
      // Found a heading
      if (node.type === "heading" && node.depth <= 3) {
        // Save previous section if it exists
        if (currentSection) {
          sections.push(currentSection);
        }

        // Start new section
        const headingText = node.children
          ?.map((child: any) => child.value || "")
          .join("")
          .trim();

        currentSection = {
          heading: headingText,
          level: node.depth,
          content: [],
        };
      }
      // Collect content after heading
      else if (currentSection) {
        if (node.type === "paragraph") {
          const text = node.children
            ?.map((child: any) => child.value || "")
            .join("")
            .trim();
          if (text) currentSection.content.push(text);
        } else if (node.type === "list") {
          const listItems = this.extractListItems(node);
          if (listItems) currentSection.content.push(listItems);
        }
      }
    });

    // Don't forget the last section
    if (currentSection) {
      sections.push(currentSection);
    }

    // Only chunk if post is structured (has multiple sections)
    if (sections.length < 3) {
      return []; // Not a structured post, skip section chunking
    }

    // Convert sections to chunks
    let sequence = 1; // 0 is reserved for full-post
    sections.forEach((section) => {
      const content = `${section.heading}\n\n${section.content.join("\n\n")}`;

      // Only include sections with substantial content
      if (content.length >= MIN_SECTION_LENGTH) {
        chunks.push({
          type: this.chunkType,
          content,
          metadata: {
            section: section.heading,
            level: section.level,
            wordCount: content.trim().split(/\s+/).length,
          },
          sequence: sequence++,
        });
      }
    });

    return chunks;
  }

  private extractListItems(listNode: any): string {
    const items: string[] = [];

    listNode.children?.forEach((listItem: any) => {
      const text = listItem.children
        ?.map((child: any) => {
          if (child.type === "paragraph") {
            return child.children
              ?.map((c: any) => c.value || "")
              .join("")
              .trim();
          }
          return "";
        })
        .filter(Boolean)
        .join(" ");

      if (text) items.push(`• ${text}`);
    });

    return items.join("\n");
  }
}
