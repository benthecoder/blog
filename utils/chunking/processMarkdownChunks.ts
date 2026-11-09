import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import path from "path";
import { readMarkdownFile } from "@/utils/content/markdown";
import { postFrontmatterSchema } from "@/utils/content/schemas";

import { extractFullPost } from "./extractors/fullPost";
import { extractSections } from "./extractors/sections";
import { extractQuotes } from "./extractors/quotes";
import { extractCode } from "./extractors/code";
import type {
  ProcessedPost,
  ProcessedChunk,
  ChunkContext,
} from "@/types/chunks";

const processor = unified().use(remarkParse).use(remarkGfm).freeze();

const EXTRACTORS = [
  ["full-post", extractFullPost],
  ["section", extractSections],
  ["quote", extractQuotes],
  ["code", extractCode],
] as const;

/**
 * Process a markdown file into semantic chunks
 *
 * @param filePath - Path to the .md file
 * @returns Frontmatter, chunks, and slug
 */
export async function processMarkdownFile(
  filePath: string
): Promise<ProcessedPost> {
  // Throws a FrontmatterError naming the file and field, so indexing stops
  // instead of replacing the index with that post missing.
  const { data: frontmatter, content: markdownContent } = readMarkdownFile(
    filePath,
    postFrontmatterSchema
  );
  const slug = path.basename(filePath, ".md");

  // Parse markdown into AST
  const tree = processor.parse(markdownContent);

  // Create context for extractors
  const context: ChunkContext = {
    frontmatter,
    slug,
    fullContent: markdownContent.trim(),
    currentSection: "",
  };

  // Run each extractor and collect chunks
  const allChunks: ProcessedChunk[] = [];

  for (const [type, extract] of EXTRACTORS) {
    try {
      const extractorChunks = extract(tree, context);
      allChunks.push(...extractorChunks);
    } catch (error) {
      console.error(`Error in ${type} extractor for ${slug}:`, error);
      // Continue with other extractors even if one fails
    }
  }

  // Sort by sequence to maintain order
  allChunks.sort((a, b) => a.sequence - b.sequence);

  return {
    frontmatter,
    chunks: allChunks,
    filePath: slug,
  };
}
