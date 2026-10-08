import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import { parseFrontmatter } from "@/utils/content/frontmatter";
import fs from "fs";
import path from "path";

import { extractFullPost } from "./extractors/fullPost";
import { extractSections } from "./extractors/sections";
import { extractQuotes } from "./extractors/quotes";
import { extractCode } from "./extractors/code";
import type {
  ProcessedPost,
  ProcessedChunk,
  ChunkContext,
} from "@/types/chunks";
import type { PostFrontmatter } from "@/types/post";

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
  try {
    // Read and parse file
    const content = fs.readFileSync(filePath, "utf8");
    const { data: frontmatter, content: markdownContent } =
      parseFrontmatter(content);
    const slug = path.basename(filePath, ".md");

    // Parse markdown into AST
    const tree = processor.parse(markdownContent);

    // Create context for extractors
    const context: ChunkContext = {
      frontmatter: frontmatter as PostFrontmatter,
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
      frontmatter: frontmatter as PostFrontmatter,
      chunks: allChunks,
      filePath: slug,
    };
  } catch (error) {
    // Graceful error handling
    const slug = path.basename(filePath, ".md");
    console.error(`Error processing ${slug}:`, error);

    return {
      frontmatter: { title: slug },
      chunks: [],
      filePath: slug,
    };
  }
}
