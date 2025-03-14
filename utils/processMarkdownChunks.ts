import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { visit } from 'unist-util-visit';
import matter from 'gray-matter';
import fs from 'fs';
import path from 'path';

interface ChunkMetadata {
  type: string;
  content: string;
  metadata?: Record<string, any>;
}

// Chunking configuration
const MIN_CHUNK_LENGTH = 10; // Minimum size for a standalone chunk
const MAX_CHUNK_LENGTH = 200; // Target size for chunks (reduced for more granularity)
const OVERLAP_PERCENTAGE = 0.3; // 30% overlap between sliding windows
const OVERLAP_MIN_CHARS = 100; // Minimum overlap in characters
const OVERLAP_MAX_CHARS = 200; // Maximum overlap in characters
const MIN_BULLET_POINTS = 3; // Minimum bullet points for a list chunk

function shouldBeSeparateChunk(
  content: string | undefined,
  type: string = 'text'
): boolean {
  if (!content) return false;

  // Always keep these as separate chunks
  if (type === 'code' || type === 'quote') return true;
  if (type === 'heading' && content.length > 30) return true; // Keep meaningful headers
  if (type === 'bullet-list') return true; // Always keep lists separate

  // Check word count AND character length for text content
  const wordCount = content.trim().split(/\s+/).length;
  const MIN_WORD_COUNT = 3; // Minimum words to consider a chunk worthwhile

  // For text/paragraph content, ensure it has enough words and characters
  if (type === 'text' || type === 'paragraph') {
    return content.length >= MIN_CHUNK_LENGTH && wordCount >= MIN_WORD_COUNT;
  }

  // For other content types, use length requirement only
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
    let currentChunk = '';
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

        currentChunk = lastChunkEndSentences.join('');
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
    .join('\n\n')
    .trim();
}

/**
 * Process a markdown file into semantic chunks with overlapping content
 * This implementation uses a sliding window approach to maintain context between chunks
 */
export async function processMarkdownFile(filePath: string) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const { data: frontmatter, content: markdownContent } = matter(content);
    const slug = path.basename(filePath, '.md');

    const processor = unified()
      .use(remarkParse as any) // Type assertion to bypass strict typing
      .use(remarkGfm as any); // Type assertion to bypass strict typing

    const tree = await processor.parse(markdownContent);
    const chunks: ChunkMetadata[] = [];
    let currentSection = '';
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
      type: 'mixed',
      contents: [],
      section: '',
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
          contentBuffer.type === 'paragraph' ||
          contentBuffer.type === 'text'
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
        case 'heading':
          if (node.depth <= 3 && node.children?.[0]?.value) {
            flushBuffer();
            currentSection = node.children[0].value;
            chunks.push({
              type: 'heading',
              content: node.children[0].value,
              metadata: {
                section: currentSection,
                sequence: sequence++,
                depth: node.depth,
              },
            });
          }
          break;

        case 'paragraph':
          flushBuffer();
          const paragraphContent = node.children
            .map((child: any) => child.value || '')
            .join('')
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
                const contextPrefix = '...';
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
              if (shouldBeSeparateChunk(content, 'paragraph')) {
                const wordCount = content.trim().split(/\s+/).length;
                chunks.push({
                  type: 'paragraph',
                  content: content,
                  metadata: {
                    section: currentSection,
                    sequence: sequence++,
                    isOverlapping:
                      index > 0 || lastProcessedParagraphs.length > 0,
                    // Track position in sequence for context awareness
                    positionInSequence:
                      index === 0
                        ? 'start'
                        : index === paragraphs.length - 1
                        ? 'end'
                        : 'middle',
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
                  contentBuffer.type = 'text';
                } else {
                  // Silently ignore tiny content without logging
                  // (content is too small to be meaningful)
                }
              }
            });
          }
          break;

        case 'blockquote':
          flushBuffer();
          const quoteContent = node.children
            .map((child: any) => child.children[0].value)
            .join('\n')
            .trim();

          if (quoteContent) {
            chunks.push({
              type: 'quote',
              content: quoteContent,
              metadata: {
                section: currentSection,
                sequence: sequence++,
              },
            });
          }
          break;

        case 'list':
          const listItems = node.children
            .map((listItem: any) =>
              listItem.children
                .map((child: any) => child.children[0].value)
                .join('')
                .trim()
            )
            .filter(Boolean);

          if (listItems.length >= MIN_BULLET_POINTS) {
            flushBuffer();
            chunks.push({
              type: 'bullet-list',
              content: listItems.join('\n'),
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

        case 'code':
          flushBuffer();
          if (node.value?.trim()) {
            chunks.push({
              type: 'code',
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
    const normalizedPath = path.basename(filePath, '.md');
    console.error(`Error processing ${normalizedPath}:`, error);
    return {
      frontmatter: { title: normalizedPath },
      chunks: [],
      filePath: normalizedPath,
    };
  }
}
