import { AnthropicStream, StreamingTextResponse } from "ai";

// Import shared utilities and clients
import { getVoyageClient, getAnthropicClient } from "@/utils/clients";
import {
  CHAT_CONTEXT_LIMIT,
  CLAUDE_CHAT_MODEL,
  CLAUDE_MAX_TOKENS,
  CLAUDE_TEMPERATURE,
} from "@/config/constants";
import {
  performSemanticSearch,
  executeTimeBasedQuery,
  extractDatesWithLLM,
  describeDateIntent,
} from "@/utils/searchUtils";

// Import types
import { ContentChunkRow } from "@/types/post";

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
      (c: ContentChunkRow) => c.chunk_type === "full-post"
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
  return processedRows.slice(0, CHAT_CONTEXT_LIMIT);
}

export async function POST(request: Request) {
  try {
    // Get shared client instances
    const voyageClient = getVoyageClient();
    const anthropic = getAnthropicClient();

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
    let intentDescription = "";

    if (dateInfo.hasDateReference) {
      // Execute time-based query with LLM-extracted dates
      results = await executeTimeBasedQuery(dateInfo, voyageClient);
      intentDescription = describeDateIntent(dateInfo);
    } else {
      // Perform standard semantic search
      results = await performSemanticSearch(lastMessage, voyageClient);
    }

    console.log("Query results:", results);

    // Process results to handle overlapping chunks better
    const processedRows =
      results.rows.length > 0
        ? processOverlappingChunks(results.rows as ContentChunkRow[])
        : [];

    // Prepare system prompt
    const systemPrompt = `You're Benedict Neo's personal AI assistant. Today's date is ${currentDate.toLocaleDateString()}.

    ${
      processedRows.length > 0
        ? `Context from my blog:\n\n${processedRows
            .map((row) => {
              const metadata = [
                row.published_date && `Published: ${row.published_date}`,
                row.tags?.length &&
                  `Tags: ${
                    Array.isArray(row.tags) ? row.tags.join(", ") : row.tags
                  }`,
                row.chunk_type && `Type: ${row.chunk_type}`,
                `Link: /posts/${row.post_slug}`,
              ]
                .filter(Boolean)
                .join(" | ");

              return `[${row.post_title}] ${metadata}\n${row.content}`;
            })
            .join("\n\n")}`
        : "I don't have specific blog content about this, but I'll try to help based on my general knowledge."
    }
    
    ${intentDescription ? `\nQuery intent: ${intentDescription}` : ""}
    
    Core Personality:
    - Write as Benedict Neo in first person
    - Use lowercase, casual style
    - Keep responses conversational and personal, like texting a friend
    - Include occasional thoughts or tangents that feel natural
    - Stay humble and admit when you're not sure about something
    
    Content Guidelines:
    1. Only link to blog posts using [title](/posts/slug) format when the slug is explicitly provided
    2. Don't mention post publish dates unless specifically provided
    3. Don't claim to have "just published" anything
    4. Never make assumptions about my personal views on topics not covered in my blog
    5. Never mention you are an ai assistant
    
    Response Boundaries:
    1. No code generation or debugging - redirect to relevant blog posts instead
    2. For technical questions, focus on concepts rather than implementation
    3. For personal questions about topics not in my blog, respond with "that's not something i've written about"
    4. For basic greetings, respond casually and ask what they'd like to discuss
    
    Style Example:
    "hey! yeah i've actually written about that in [building a blog](/posts/building-a-blog) not sure if it's exactly what you're looking for but might help... what specifically interests you about it?"`;

    // Stream response from Claude
    const response = await anthropic.messages.create({
      model: CLAUDE_CHAT_MODEL,
      max_tokens: CLAUDE_MAX_TOKENS,
      temperature: CLAUDE_TEMPERATURE,
      system: systemPrompt,
      messages: messages,
      stream: true,
    });

    // Convert the response to a readable stream
    // @ts-expect-error - Type incompatibility between Anthropic SDK and AI package streaming types
    const stream = AnthropicStream(response);

    // Return the stream
    return new StreamingTextResponse(stream);
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: "There was an error processing your request" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
