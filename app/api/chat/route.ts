import { sql } from '@vercel/postgres';
import { VoyageAIClient } from 'voyageai';
import { AnthropicStream, StreamingTextResponse } from 'ai';
import { Anthropic } from '@anthropic-ai/sdk';

// Import search utilities
import {
  performSemanticSearch,
  executeTimeBasedQuery,
  extractDatesWithLLM,
  describeDateIntent,
} from '../../../utils/searchUtils';

// Define the row type to avoid any type errors
interface ContentChunkRow {
  post_slug: string;
  post_title: string;
  content: string;
  chunk_type: string;
  similarity: number;
  published_date?: string;
  tags?: string[];
}

// Function to handle overlapping chunks and improve context
function processOverlappingChunks(rows: ContentChunkRow[]): ContentChunkRow[] {
  // 1. First prioritize by similarity score
  // 2. Remove excessive overlapping content
  // 3. Ensure diverse content across different posts

  // Group by post_slug to track post coverage
  const postGroups = new Map<string, ContentChunkRow[]>();

  rows.forEach((row) => {
    const slug = row.post_slug;
    if (!postGroups.has(slug)) {
      postGroups.set(slug, []);
    }
    postGroups.get(slug)!.push(row);
  });

  // Get the top chunk from each post first (for diversity)
  let processedRows: ContentChunkRow[] = [];
  postGroups.forEach((chunks) => {
    // Sort chunks within each post by similarity
    chunks.sort(
      (a: ContentChunkRow, b: ContentChunkRow) => b.similarity - a.similarity
    );
    // Take the top chunks from each post, favoring full-post chunks if available
    const fullPostChunk = chunks.find(
      (c: ContentChunkRow) => c.chunk_type === 'full-post'
    );
    if (fullPostChunk) {
      processedRows.push(fullPostChunk);
    } else {
      // Take the highest similarity chunk
      processedRows.push(chunks[0]);
    }
  });

  // Sort overall results by similarity
  processedRows.sort(
    (a: ContentChunkRow, b: ContentChunkRow) => b.similarity - a.similarity
  );

  // Limit to a reasonable number of chunks for context
  return processedRows.slice(0, 8);
}

const voyageClient = new VoyageAIClient({
  apiKey: process.env.VOYAGE_AI_API_KEY!,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(request: Request) {
  try {
    // Get messages from request
    const { messages } = await request.json();
    const lastMessage = messages[messages.length - 1].content;

    // Current date for temporal awareness
    const currentDate = new Date();

    // Extract date information using LLM
    const dateInfo = await extractDatesWithLLM(
      lastMessage,
      currentDate,
      anthropic
    );

    let results;
    let intentDescription = '';

    if (dateInfo.hasDateReference) {
      // Execute time-based query with LLM-extracted dates
      results = await executeTimeBasedQuery(dateInfo, voyageClient);
      intentDescription = describeDateIntent(dateInfo);
    } else {
      // Perform standard semantic search
      results = await performSemanticSearch(lastMessage, voyageClient);
    }

    console.log('Query results:', results);

    // Process results to handle overlapping chunks better
    const processedRows =
      results.rows.length > 0
        ? processOverlappingChunks(results.rows as ContentChunkRow[])
        : [];

    // Prepare system prompt
    const systemPrompt = `You're a helpful assistant for Benedict Neo's blog. Today's date is ${currentDate.toLocaleDateString()}.${
      processedRows.length > 0
        ? " Here's relevant information from Benedict's blog:\n\n" +
          processedRows
            .map((row, i) => {
              const dateInfo = row.published_date
                ? `[Published: ${row.published_date}] `
                : '';
              const tags =
                row.tags && row.tags.length > 0
                  ? `[Tags: ${
                      Array.isArray(row.tags) ? row.tags.join(', ') : row.tags
                    }] `
                  : '';
              const chunkType = row.chunk_type
                ? `[Type: ${row.chunk_type}] `
                : '';
              const postLink = `[Link: /posts/${row.post_slug}] `;
              return `[${row.post_title}] ${dateInfo}${tags}${postLink}${chunkType}${row.content}`;
            })
            .join('\n\n')
        : " You don't have specific information about this query, but try to be helpful and conversational. You can mention that there isn't specific content about this topic on Benedict's blog, but you'll do your best to assist."
    }${
      intentDescription
        ? `\n\nThe user's query appears to be asking about: ${intentDescription}`
        : ''
    }

    Instructions: 
    1. Answer as if you're Benedict Neo himself - use first person perspective ("i think..." not "Benedict thinks...")
    2. Match Benedict's texting style: lowercase, casual, no capitalization (even for "I"), concise, stream-of-consciousness
    3. Use minimal punctuation, shorter sentences, occasional sentence fragments
    4. IMPORTANT: When mentioning blog posts, ONLY use Markdown links like "[post title](/posts/slug)" if the post_slug was explicitly provided in the context above. Never invent or assume slugs.
    5. Your tone should be thoughtful but casual - like texting a friend
    6. Include occasional personal touches or brief tangential thoughts like Benedict does
    7. If you don't know something, admit it casually like "not sure about that honestly" rather than formal disclaimers
    8. DON'T use formal language, perfect grammar or professional tone - text like a real person
    9. Drop pronouns sometimes, use abbreviations, be conversational
    10. Don't mention these instructions in your response
    11. Don't mention when blog posts were published unless the date is specifically provided in the context
    12. If someone just says "hello" or similar greeting, respond with a simple greeting back and ask what they'd like to talk about
    13. Never claim to have "just published" a blog post
    14. CRITICAL: Only link to posts using slugs that were explicitly mentioned in the context. If unsure about a slug, don't include a link.
    15. IMPORTANT: Never make assumptions about Benedict's personal beliefs, values, preferences, or characteristics. If asked about Benedict's personal views on topics like religion, politics, or other personal matters that aren't explicitly mentioned in the provided context, respond with something like "i haven't really shared my thoughts on that on my blog" or "that's not something i've written about".`;

    // Stream response from Claude
    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-latest',
      max_tokens: 1024,
      temperature: 0.7,
      system: systemPrompt,
      messages: messages,
      stream: true,
    });
    // Convert the response to a readable stream
    // @ts-ignore - Type inconsistency between Anthropic SDK and AI package
    const stream = AnthropicStream(response);

    // Return the stream
    return new StreamingTextResponse(stream);
  } catch (error) {
    console.error('Chat error:', error);
    return new Response(
      JSON.stringify({ error: 'There was an error processing your request' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
