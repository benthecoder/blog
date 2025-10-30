/**
 * Markdown Chunking - Simplified Extractor-Based Approach
 *
 * This module processes markdown files into semantic chunks using
 * clean extractor classes. Each chunk type (full-post, section,
 * quote, code) is handled by its own extractor.
 *
 * Previous version: 451 lines with complex sliding window logic
 * This version: ~150 lines, KISS principle, easy to understand
 */

import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import matter from "gray-matter";
import fs from "fs";
import path from "path";

// Import our clean extractor classes
import { FullPostExtractor } from "./chunking/extractors/FullPostExtractor";
import { SectionExtractor } from "./chunking/extractors/SectionExtractor";
import { QuoteExtractor } from "./chunking/extractors/QuoteExtractor";
import { CodeExtractor } from "./chunking/extractors/CodeExtractor";

// Import types
import { ProcessedPost, ProcessedChunk, ChunkContext } from "@/types/chunks";
import { PostFrontmatter } from "@/types/post";

/**
 * Process a markdown file into semantic chunks
 *
 * @param filePath - Path to the .md file
 * @returns Frontmatter, chunks, and slug
 */
export async function processMarkdownFile(
  filePath: string
): Promise<ProcessedPost> {
  try {
    // Read and parse file
    const content = fs.readFileSync(filePath, "utf8");
    const { data: frontmatter, content: markdownContent } = matter(content);
    const slug = path.basename(filePath, ".md");

    // Parse markdown into AST
    const processor = unified().use(remarkParse).use(remarkGfm);
    const tree = processor.parse(markdownContent);

    // Create context for extractors
    const context: ChunkContext = {
      frontmatter: frontmatter as PostFrontmatter,
      slug,
      fullContent: markdownContent.trim(),
      currentSection: "",
    };

    // Initialize all extractors
    const extractors = [
      new FullPostExtractor(),
      new SectionExtractor(),
      new QuoteExtractor(),
      new CodeExtractor(),
    ];

    // Run each extractor and collect chunks
    const allChunks: ProcessedChunk[] = [];

    for (const extractor of extractors) {
      try {
        const extractorChunks = extractor.process(tree, context);
        allChunks.push(...extractorChunks);
      } catch (error) {
        console.error(
          `Error in ${extractor.chunkType} extractor for ${slug}:`,
          error
        );
        // Continue with other extractors even if one fails
      }
    }

    // Sort by sequence to maintain order
    allChunks.sort((a, b) => a.sequence - b.sequence);

    return {
      frontmatter: frontmatter as PostFrontmatter,
      chunks: allChunks,
      filePath: slug,
    };
  } catch (error) {
    // Graceful error handling
    const slug = path.basename(filePath, ".md");
    console.error(`Error processing ${slug}:`, error);

    return {
      frontmatter: { title: slug } as PostFrontmatter,
      chunks: [],
      filePath: slug,
    };
  }
}
