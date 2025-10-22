import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import { visit } from "unist-util-visit";
import matter from "gray-matter";
import fs from "fs";
import path from "path";

// Import shared constants
import {
  MIN_STANDALONE_CHUNK,
  TARGET_CHUNK_LENGTH,
  CHUNK_OVERLAP_PERCENTAGE,
  CHUNK_OVERLAP_MIN_CHARS,
  CHUNK_OVERLAP_MAX_CHARS,
  MIN_BULLET_POINTS,
  MIN_WORD_COUNT,
} from "@/config/constants";

// Import types
import { ChunkMetadata } from "@/types/post";

// Local constants used in this file
const MIN_CHUNK_LENGTH = MIN_STANDALONE_CHUNK;
const MAX_CHUNK_LENGTH = TARGET_CHUNK_LENGTH;
const OVERLAP_PERCENTAGE = CHUNK_OVERLAP_PERCENTAGE;
const OVERLAP_MIN_CHARS = CHUNK_OVERLAP_MIN_CHARS;
const OVERLAP_MAX_CHARS = CHUNK_OVERLAP_MAX_CHARS;
const MIN_WORD_COUNT_LOCAL = MIN_WORD_COUNT;

function shouldBeSeparateChunk(
  content: string | undefined,
  type: string = "text"
): boolean {
  if (!content) return false;

  const trimmedContent = content.trim();

  // Filter out HTML-only content
  if (/^<\/?[a-z]+>$/i.test(trimmedContent)) return false;

  // Filter out empty or whitespace-only content
  if (!trimmedContent || trimmedContent.length < 20) return false;

  // Check word count for all types
  const wordCount = trimmedContent.split(/\s+/).filter(Boolean).length;
  if (wordCount < MIN_WORD_COUNT_LOCAL) return false;

  // For code blocks, ensure they have substance
  if (type === "code") {
    return content.length >= 30; // Minimum code block size
  }

  // For quotes, ensure they're meaningful
  if (type === "quote") {
    return content.length >= 50 && wordCount >= 5; // At least 50 chars and 5 words
  }

  // For bullet lists, ensure they have multiple items
  if (type === "bullet-list") {
    const items = trimmedContent.split("\n").filter(Boolean);
    return items.length >= MIN_BULLET_POINTS && content.length >= 30;
  }

  // For headings, keep meaningful ones
  if (type === "heading") {
    return content.length > 30;
  }

  // For text/paragraph content, ensure it has enough words and characters
  if (type === "text" || type === "paragraph") {
    return (
      content.length >= MIN_CHUNK_LENGTH && wordCount >= MIN_WORD_COUNT_LOCAL
    );
  }

  // For other content types, use length requirement
  return content.length >= MIN_CHUNK_LENGTH;
}

/**
 * Split text into overlapping chunks using a sliding window approach
 * This preserves context between chunks while allowing for granular search
 */
function splitIntoParagraphs(content: string): string[] {
  // Split on double newlines first
  const segments = content.split(/\n\n+/);

  // Process each segment with sliding window
  return segments.flatMap((segment) => {
    // For short segments, keep as is
    if (segment.length <= MAX_CHUNK_LENGTH) return [segment];

    // For longer segments, use sliding window with sentence boundaries
    const sentences = segment.match(/[^.!?]+[.!?]+/g) || [segment];
    const chunks: string[] = [];

    // If we can't split by sentences, use character-based sliding window
    if (sentences.length <= 1) {
      return createOverlappingChunks(segment, MAX_CHUNK_LENGTH);
    }

    // Use sentence-based sliding window
    let currentChunk = "";
    let lastChunkEndSentences: string[] = [];
    const maxOverlapSentences = 2; // Number of sentences to overlap

    sentences.forEach((sentence, i) => {
      // If adding this sentence would exceed max length
      if ((currentChunk + sentence).length > MAX_CHUNK_LENGTH && currentChunk) {
        // Store the chunk
        chunks.push(currentChunk.trim());

        // Start a new chunk with overlap from the end of the previous chunk
        lastChunkEndSentences = sentences
          .slice(Math.max(0, i - maxOverlapSentences), i)
          .filter((s) => s.trim().length > 0);

        currentChunk = lastChunkEndSentences.join("");
      }

      currentChunk += sentence;
    });

    // Add the final chunk if there's anything left
    if (currentChunk && currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  });
}

/**
 * Create overlapping chunks from text using character-based sliding window
 * Used when sentence-based chunking isn't possible
 */
function createOverlappingChunks(text: string, chunkSize: number): string[] {
  const chunks: string[] = [];
  const textLength = text.length;

  if (textLength <= chunkSize) {
    return [text];
  }

  // Calculate overlap size based on percentage with bounds
  const overlapSize = Math.min(
    Math.max(Math.floor(chunkSize * OVERLAP_PERCENTAGE), OVERLAP_MIN_CHARS),
    OVERLAP_MAX_CHARS
  );

  const stride = chunkSize - overlapSize;

  for (let i = 0; i < textLength; i += stride) {
    const end = Math.min(i + chunkSize, textLength);
    chunks.push(text.substring(i, end));

    // If we've reached the end, break
    if (end === textLength) break;
  }

  return chunks;
}

function countWords(str: string): number {
  return str.trim().split(/\s+/).length;
}

function combineContent(contents: string[]): string {
  return contents
    .filter((content) => content && content.trim().length > 0)
    .join("\n\n")
    .trim();
}

/**
 * Process a markdown file into semantic chunks with overlapping content
 * This implementation uses a sliding window approach to maintain context between chunks
 */
export async function processMarkdownFile(filePath: string) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const { data: frontmatter, content: markdownContent } = matter(content);
    const slug = path.basename(filePath, ".md");

    const processor = unified()
      .use(remarkParse as any) // Type assertion to bypass strict typing
      .use(remarkGfm as any); // Type assertion to bypass strict typing

    const tree = await processor.parse(markdownContent);
    const chunks: ChunkMetadata[] = [];
    let currentSection = "";
    let sequence = 0;

    // Track paragraph context for improved overlapping
    let lastProcessedParagraphs: string[] = [];
    const MAX_CONTEXT_PARAGRAPHS = 2; // Number of paragraphs to keep for context

    // Buffer for accumulating small content
    let contentBuffer: {
      type: string;
      contents: string[];
      section: string;
    } = {
      type: "mixed",
      contents: [],
      section: "",
    };

    const flushBuffer = () => {
      const combinedContent = combineContent(contentBuffer.contents);
      // Enhanced validation to prevent tiny chunks
      if (shouldBeSeparateChunk(combinedContent, contentBuffer.type)) {
        // Add to chunks with metadata about context
        chunks.push({
          type: contentBuffer.type,
          content: combinedContent,
          metadata: {
            section: contentBuffer.section,
            sequence: sequence++,
            isComposite: true,
            hasOverlappingContext: lastProcessedParagraphs.length > 0,
            wordCount: combinedContent.trim().split(/\s+/).length, // Track word count for debugging
          },
        });

        // Update context tracking
        if (
          contentBuffer.type === "paragraph" ||
          contentBuffer.type === "text"
        ) {
          updateLastProcessedParagraphs(combinedContent);
        }
      } else {
        // Silently skip content that is too small to be meaningful
        // No logging to keep console output clean
      }
      contentBuffer.contents = [];
    };

    // Helper to update context tracking
    const updateLastProcessedParagraphs = (content: string) => {
      lastProcessedParagraphs.push(content);
      if (lastProcessedParagraphs.length > MAX_CONTEXT_PARAGRAPHS) {
        lastProcessedParagraphs.shift(); // Remove oldest paragraph
      }
    };

    visit(tree, (node: any) => {
      switch (node.type) {
        case "heading":
          if (node.depth <= 3 && node.children?.[0]?.value) {
            flushBuffer();
            currentSection = node.children[0].value;
            chunks.push({
              type: "heading",
              content: node.children[0].value,
              metadata: {
                section: currentSection,
                sequence: sequence++,
                depth: node.depth,
              },
            });
          }
          break;

        case "paragraph":
          flushBuffer();
          const paragraphContent = node.children
            .map((child: any) => child.value || "")
            .join("")
            .trim();

          if (paragraphContent) {
            // Create sliding window chunks with overlap
            const paragraphs = splitIntoParagraphs(paragraphContent);

            // Add context from previous paragraphs for improved context preservation
            const contextualParagraphs = paragraphs.map((content, index) => {
              // For first paragraph in a sequence, add context from previous paragraphs if available
              if (index === 0 && lastProcessedParagraphs.length > 0) {
                const lastContext =
                  lastProcessedParagraphs[lastProcessedParagraphs.length - 1];

                // Skip adding context if the current paragraph already contains it (sliding window overlap)
                if (
                  content.includes(
                    lastContext.substring(lastContext.length - 50)
                  )
                ) {
                  return content;
                }

                // Add a small contextual lead-in from the previous paragraph
                const contextPrefix = "...";
                return content;
              }
              return content;
            });

            // Process each paragraph
            contextualParagraphs.forEach((content, index) => {
              // Update tracking for context
              if (index === paragraphs.length - 1) {
                updateLastProcessedParagraphs(paragraphs[index]);
              }

              // Enhanced validation to prevent tiny chunks
              if (shouldBeSeparateChunk(content, "paragraph")) {
                const wordCount = content.trim().split(/\s+/).length;
                chunks.push({
                  type: "paragraph",
                  content: content,
                  metadata: {
                    section: currentSection,
                    sequence: sequence++,
                    isOverlapping:
                      index > 0 || lastProcessedParagraphs.length > 0,
                    // Track position in sequence for context awareness
                    positionInSequence:
                      index === 0
                        ? "start"
                        : index === paragraphs.length - 1
                          ? "end"
                          : "middle",
                    wordCount: wordCount, // Track word count for debugging
                  },
                });
              } else {
                // Check if content has at least some substance before adding to buffer
                const wordCount = content.trim().split(/\s+/).length;
                if (wordCount >= 3) {
                  // At least a few words to be worth buffering
                  contentBuffer.contents.push(content);
                  contentBuffer.section = currentSection;
                  contentBuffer.type = "text";
                } else {
                  // Silently ignore tiny content without logging
                  // (content is too small to be meaningful)
                }
              }
            });
          }
          break;

        case "blockquote":
          flushBuffer();
          const quoteContent = node.children
            .map((child: any) => child.children[0].value)
            .join("\n")
            .trim();

          if (quoteContent) {
            chunks.push({
              type: "quote",
              content: quoteContent,
              metadata: {
                section: currentSection,
                sequence: sequence++,
              },
            });
          }
          break;

        case "list":
          // Helper function to safely extract text from any node type
          const extractText = (node: any): string => {
            if (!node) return "";

            // Direct text value
            if (node.value) return node.value;

            // Code block
            if (node.type === "code") return node.value || "";

            // Has children - recursively extract
            if (node.children && Array.isArray(node.children)) {
              return node.children.map(extractText).join("");
            }

            return "";
          };

          const listItems = node.children
            .map((listItem: any) => {
              if (!listItem.children) return "";
              return listItem.children
                .map((child: any) => extractText(child))
                .join("")
                .trim();
            })
            .filter(Boolean);

          if (listItems.length >= MIN_BULLET_POINTS) {
            flushBuffer();
            chunks.push({
              type: "bullet-list",
              content: listItems.join("\n"),
              metadata: {
                section: currentSection,
                sequence: sequence++,
                bulletCount: listItems.length,
              },
            });
          } else {
            // Add small lists to buffer
            listItems.forEach((item: string) => {
              contentBuffer.contents.push(`• ${item}`);
            });
          }
          break;

        case "code":
          flushBuffer();
          if (node.value?.trim()) {
            chunks.push({
              type: "code",
              content: node.value.trim(),
              metadata: {
                language: node.lang,
                section: currentSection,
                sequence: sequence++,
              },
            });
          }
          break;
      }
    });

    flushBuffer(); // Clean up any remaining content

    return {
      frontmatter: {
        title: frontmatter?.title || slug,
        ...frontmatter,
      },
      chunks: chunks.filter((chunk) => chunk.content.trim().length > 0),
      filePath: slug,
    };
  } catch (error) {
    // Normalize the file path to match the expected format in the database
    const normalizedPath = path.basename(filePath, ".md");
    console.error(`Error processing ${normalizedPath}:`, error);
    return {
      frontmatter: { title: normalizedPath },
      chunks: [],
      filePath: normalizedPath,
    };
  }
}
