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

// Adjusted constants for better granularity
const MIN_CHUNK_LENGTH = 150; // Decreased for more granular chunks
const MAX_CHUNK_LENGTH = 800; // Decreased to split content more frequently
const MIN_BULLET_POINTS = 3; // Keep small lists as separate chunks

function shouldBeSeparateChunk(
  content: string | undefined,
  type: string = 'text'
): boolean {
  if (!content) return false;

  // Always keep these as separate chunks
  if (type === 'code' || type === 'quote') return true;
  if (type === 'heading' && content.length > 30) return true; // Keep meaningful headers
  if (type === 'bullet-list') return true; // Always keep lists separate

  // For other content types, use length/word requirements
  return content.length >= MIN_CHUNK_LENGTH;
}

// Add function to split long paragraphs
function splitIntoParagraphs(content: string): string[] {
  // Split on double newlines first
  const segments = content.split(/\n\n+/);

  // Further split long segments on sentence boundaries
  return segments.flatMap((segment) => {
    if (segment.length <= MAX_CHUNK_LENGTH) return [segment];

    // Split on sentence boundaries
    const sentences = segment.match(/[^.!?]+[.!?]+/g) || [segment];
    let currentChunk = '';
    const chunks: string[] = [];

    sentences.forEach((sentence) => {
      if ((currentChunk + sentence).length > MAX_CHUNK_LENGTH) {
        if (currentChunk) chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += sentence;
      }
    });

    if (currentChunk) chunks.push(currentChunk.trim());
    return chunks;
  });
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
      if (shouldBeSeparateChunk(combinedContent)) {
        chunks.push({
          type: contentBuffer.type,
          content: combinedContent,
          metadata: {
            section: contentBuffer.section,
            sequence: sequence++,
            isComposite: true,
          },
        });
      }
      contentBuffer.contents = [];
    };

    visit(tree, (node: any) => {
      switch (node.type) {
        case 'heading':
          if (node.depth <= 2 && node.children?.[0]?.value) {
            flushBuffer();
            currentSection = node.children[0].value;
            // Don't create separate chunks for headings, just track them
          }
          break;

        case 'paragraph':
          flushBuffer();
          const paragraphContent = node.children
            .map((child: any) => child.value || '')
            .join('')
            .trim();

          if (paragraphContent) {
            const paragraphs = splitIntoParagraphs(paragraphContent);
            paragraphs.forEach((content) => {
              if (shouldBeSeparateChunk(content, 'paragraph')) {
                chunks.push({
                  type: 'paragraph',
                  content: content,
                  metadata: {
                    section: currentSection,
                    sequence: sequence++,
                  },
                });
              } else {
                contentBuffer.contents.push(content);
                contentBuffer.section = currentSection;
                contentBuffer.type = 'text';
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
    console.error(`Error processing ${filePath}:`, error);
    return {
      frontmatter: { title: path.basename(filePath, '.md') },
      chunks: [],
      filePath: path.basename(filePath, '.md'),
    };
  }
}
