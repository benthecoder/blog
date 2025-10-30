// Configure environment variables BEFORE any imports that use them
import * as dotenv from "dotenv";
dotenv.config();

// Ensure POSTGRES_URL is set (Vercel postgres needs this specific var name)
if (!process.env.POSTGRES_URL && process.env.DATABASE_URL) {
  process.env.POSTGRES_URL = process.env.DATABASE_URL;
}

// Now import modules that depend on environment variables
import { processAllPosts } from "@/utils/processAllPosts";
import { sql } from "@vercel/postgres";
import { v4 as uuidv4 } from "uuid";
import chalk from "chalk";
import ora from "ora";

// Import shared utilities
import { getVoyageClient } from "@/utils/clients";
import { formatEmbeddingForPostgres } from "@/utils/embeddingUtils";
import { withEmbeddingRetry, wait } from "@/utils/retry";
import { extractPostDate, toISODateString } from "@/utils/dateUtils";
import { extractTags } from "@/utils/postUtils";
import { DELAY_BETWEEN_BATCHES } from "@/config/constants";

// Import types
import { PostFrontmatter } from "@/types/post";
import { ProcessedChunk, ProcessedPost } from "@/types/chunks";

interface EmbeddingResult {
  successfulChunks: number;
  failedChunks: number;
}

// Get VoyageAI client singleton
const client = getVoyageClient();

// Check if table exists and create it if it doesn't
const setupTable = async () => {
  try {
    // Create extension if it doesn't exist
    await sql`CREATE EXTENSION IF NOT EXISTS vector;`;

    // Check if the table already exists
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'content_chunks'
      );
    `;

    // Only create table if it doesn't exist
    if (!tableExists.rows[0].exists) {
      console.log("Table does not exist, creating new one...");

      // Create table with clean schema
      await sql`
        CREATE TABLE content_chunks (
          id UUID PRIMARY KEY,
          post_slug TEXT,
          post_title TEXT,
          content TEXT,
          chunk_type TEXT,
          metadata JSONB,
          sequence INTEGER,
          embedding vector(1024),
          published_date DATE,
          tags TEXT[],
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `;

      // Create indexes in separate commands
      await sql`CREATE INDEX idx_content_chunks_post_slug ON content_chunks(post_slug);`;
      await sql`CREATE INDEX idx_content_chunks_chunk_type ON content_chunks(chunk_type);`;
      await sql`CREATE INDEX idx_content_chunks_published_date ON content_chunks(published_date);`;
      await sql`CREATE INDEX idx_content_chunks_tags ON content_chunks USING GIN(tags);`;

      console.log(chalk.green("Table created successfully with all indexes"));
    } else {
      console.log(chalk.green("Table already exists, skipping creation"));
    }
  } catch (error) {
    console.error("Error setting up table:", error);
    throw error;
  }
};

// Type definition for the API response
interface EmbeddingResponse {
  data: Array<{
    embedding: number[];
    [key: string]: any;
  }>;
  [key: string]: any;
}

/**
 * Wrapper for embedding with retry using VoyageAI
 */
async function embedWithRetry(texts: string[]): Promise<EmbeddingResponse> {
  return withEmbeddingRetry(async () => {
    return (await client.embed({
      model: "voyage-3.5-lite",
      input: texts,
      inputType: "document",
    })) as Promise<EmbeddingResponse>;
  });
}

// Note: extractPostDate is now imported from utils/dateUtils
// Note: extractTags is now imported from utils/postUtils
// Note: wait() is now imported from utils/retry
// Note: formatEmbeddingForPostgres is now imported from utils/embeddingUtils

async function generateEmbeddingsForSingleFile(
  filePath: string
): Promise<EmbeddingResult> {
  // Remove .md extension if it exists
  const normalizedFilePath = filePath.endsWith(".md")
    ? filePath.substring(0, filePath.length - 3)
    : filePath;

  const posts = await processAllPosts();
  const post = posts.find((p) => p.filePath === normalizedFilePath);

  if (!post) {
    console.error(`File ${normalizedFilePath} not found`);
    return { successfulChunks: 0, failedChunks: 0 };
  }

  // Delete existing embeddings for this post before generating new ones
  try {
    console.log(`Removing previous embeddings for ${normalizedFilePath}...`);
    await sql`DELETE FROM content_chunks WHERE post_slug = ${normalizedFilePath}`;
    console.log(chalk.green(`Previous embeddings removed`));
  } catch (error) {
    console.error("Error removing previous embeddings:", error);
    // Continue with embedding generation even if deletion fails
  }

  const { frontmatter, chunks } = post;
  let successfulChunks = 0;
  let failedChunks = 0;

  // Create a chunk-level progress bar
  function updateChunkProgress() {
    const total = chunks.length;
    const completed = successfulChunks + failedChunks;
    const percentage = Math.round((completed / total) * 100);
    return `Chunk progress: ${completed}/${total} (${percentage}%)`;
  }

  console.log(`\nProcessing ${filePath} with ${chunks.length} chunks`);
  // Initial progress for chunks
  if (chunks.length > 0) {
    console.log(updateChunkProgress());
  }

  // Extract post date
  const publishedDate = extractPostDate(filePath, frontmatter);
  const formattedPublishedDate = toISODateString(publishedDate);

  // Process chunks in batches (smaller batch size for single file)
  const SINGLE_FILE_BATCH_SIZE = 50;
  for (let i = 0; i < chunks.length; i += SINGLE_FILE_BATCH_SIZE) {
    const batchChunks = chunks.slice(i, i + SINGLE_FILE_BATCH_SIZE);
    const batchEnd = Math.min(i + SINGLE_FILE_BATCH_SIZE, chunks.length);

    console.log(
      `\nProcessing batch ${i}-${batchEnd} of ${chunks.length} (${Math.ceil(
        (batchEnd - i) / SINGLE_FILE_BATCH_SIZE
      )}/${Math.ceil(chunks.length / SINGLE_FILE_BATCH_SIZE)} batches)`
    );

    try {
      // Format chunks with more context
      const inputTexts = batchChunks.map((chunk) => {
        const typePrefix = chunk.type.toUpperCase();
        const sectionPrefix = chunk.metadata?.section
          ? `[SECTION: ${chunk.metadata.section}] `
          : "";
        return `${typePrefix}: ${sectionPrefix}${chunk.content.trim()}`;
      });

      // Log batch info without flooding console
      console.log(`Batch size: ${inputTexts.length} chunks`);

      // Implement batch splitting if batch is too large
      let response: EmbeddingResponse;
      try {
        response = await embedWithRetry(inputTexts);
      } catch (embeddingError: unknown) {
        // If we get a timeout or other critical error, try splitting the batch in half
        const error = embeddingError as {
          message?: string;
          code?: string;
        };

        if (
          inputTexts.length > 3 &&
          (error.message?.includes("timeout") ||
            error.message?.includes("network") ||
            error.code === "ECONNRESET" ||
            error.code === "ETIMEDOUT")
        ) {
          console.log(`Error processing full batch: ${error.message}`);
          console.log(`Splitting batch into smaller chunks and retrying...`);

          // Split the batch in half
          const midpoint = Math.floor(inputTexts.length / 2);
          const firstHalf = inputTexts.slice(0, midpoint);
          const secondHalf = inputTexts.slice(midpoint);

          // Process first half
          console.log(`Processing first half (${firstHalf.length} chunks)...`);
          const firstResponse = await embedWithRetry(firstHalf);

          // Add delay between sub-batches
          await wait(DELAY_BETWEEN_BATCHES);

          // Process second half
          console.log(
            `Processing second half (${secondHalf.length} chunks)...`
          );
          const secondResponse = await embedWithRetry(secondHalf);

          // Merge responses
          response = {
            data: [...firstResponse.data, ...secondResponse.data],
          };

          console.log(
            `Successfully processed split batch with ${response.data.length} embeddings`
          );
        } else {
          // If not a timeout or the batch is already small, rethrow
          throw embeddingError;
        }
      }

      if (!response?.data?.length) {
        console.error("No embeddings data in response");
        failedChunks += batchChunks.length;
        continue;
      }

      // Store chunk IDs to track overlaps
      const chunkIds = batchChunks.map(() => uuidv4());

      // Cast frontmatter to proper type for this scope
      const typedFrontmatter = frontmatter as PostFrontmatter;

      // First pass: Insert all chunks
      const insertPromises = batchChunks.map(async (chunk, j) => {
        const embedding = response.data[j]?.embedding;
        const formattedEmbedding = formatEmbeddingForPostgres(embedding);

        // Extract tags as array using shared utility
        const tagsArray = extractTags(typedFrontmatter);

        // Define a proper interface for chunk metadata
        interface ChunkMetadata {
          post_title: string;
          isOverlapping: boolean;
          positionInSequence: string;
          published_date?: string;
          tags?: string[];
          [key: string]: any; // Allow for other metadata properties
        }

        // Enhanced metadata (non-date/tag specific info)
        const enhancedMetadata: ChunkMetadata = {
          ...chunk.metadata,
          post_title: frontmatter?.title || filePath,
          // Add sliding window metadata
          isOverlapping: chunk.metadata?.isOverlapping || false,
          positionInSequence: chunk.metadata?.positionInSequence || "unknown",
        };

        try {
          // Put the published_date in the metadata for now until we resolve the schema issue
          enhancedMetadata.published_date = formattedPublishedDate;
          enhancedMetadata.tags = tagsArray;

          await sql`
            INSERT INTO content_chunks (
              id, post_slug, post_title, content, chunk_type,
              metadata, sequence, embedding
            ) VALUES (
              ${chunkIds[j]},
              ${filePath},
              ${frontmatter?.title || filePath},
              ${chunk.content},
              ${chunk.type},
              ${JSON.stringify(enhancedMetadata)},
              ${chunk.sequence},
              ${formattedEmbedding}
            )
          `;
          return true;
        } catch (error) {
          console.error("Error inserting chunk:", error);
          return false;
        }
      });

      // Wait for inserts to complete
      const results = await Promise.all(insertPromises);
      const successCount = results.filter(Boolean).length;

      // Update counters based on results
      successfulChunks += successCount;
      failedChunks += batchChunks.length - successCount;

      // Update chunk progress
      console.log(updateChunkProgress());

      console.log(
        chalk.green(
          `Batch complete: ${successCount}/${batchChunks.length} chunks successful`
        )
      );

      // Add delay between batches to avoid rate limits
      await wait(DELAY_BETWEEN_BATCHES);
    } catch (error) {
      console.error("Error processing batch:", error);
      failedChunks += batchChunks.length;

      // Update chunk progress after error
      console.log(updateChunkProgress());
    }
  }

  return { successfulChunks, failedChunks };
}

/**
 * Optimized: Batch embeddings across multiple posts
 * Instead of processing one post at a time, we collect chunks from many posts
 * and send them in large batches (100-150 chunks) to VoyageAI.
 */
async function generateEmbeddingsForAllFiles() {
  const posts = await processAllPosts();
  const nonDraftPosts = posts.filter(
    (post) => !post.filePath.includes("/drafts/")
  );

  console.log(
    chalk.bold(
      `\nProcessing ${nonDraftPosts.length} posts with cross-post batching\n`
    )
  );

  // Step 1: Clear existing embeddings for all posts we're about to process
  const clearSpinner = ora("Clearing existing embeddings...").start();
  const result = await sql`DELETE FROM content_chunks`;
  clearSpinner.succeed(`Cleared ${result.rowCount} existing chunks`);

  // Step 2: Collect all chunks from all posts with metadata
  const collectSpinner = ora(
    "Processing markdown and collecting chunks..."
  ).start();

  interface ChunkWithContext {
    chunk: ProcessedChunk;
    post: ProcessedPost;
    publishedDate: string;
    tags: string[];
  }

  const allChunksWithContext: ChunkWithContext[] = [];

  for (const post of nonDraftPosts) {
    const { frontmatter, chunks, filePath } = post;
    const publishedDate = extractPostDate(filePath, frontmatter);
    const formattedDate = toISODateString(publishedDate);
    const tags = extractTags(frontmatter as PostFrontmatter);

    chunks.forEach((chunk) => {
      allChunksWithContext.push({
        chunk,
        post,
        publishedDate: formattedDate,
        tags,
      });
    });
  }

  collectSpinner.succeed(
    `Collected ${allChunksWithContext.length} chunks from ${nonDraftPosts.length} posts`
  );

  // Step 3: Batch chunks and generate embeddings
  console.log(chalk.bold("\nGenerating embeddings in large batches:\n"));

  const CROSS_POST_BATCH_SIZE = 120; // Conservative under 1M token limit
  let totalSuccessful = 0;
  let totalFailed = 0;
  const totalBatches = Math.ceil(
    allChunksWithContext.length / CROSS_POST_BATCH_SIZE
  );

  for (let i = 0; i < allChunksWithContext.length; i += CROSS_POST_BATCH_SIZE) {
    const batchWithContext = allChunksWithContext.slice(
      i,
      i + CROSS_POST_BATCH_SIZE
    );
    const batchNum = Math.floor(i / CROSS_POST_BATCH_SIZE) + 1;

    const batchSpinner = ora(
      `Batch ${batchNum}/${totalBatches} (${batchWithContext.length} chunks)`
    ).start();

    try {
      // Prepare texts for embedding
      const inputTexts = batchWithContext.map(({ chunk }) => {
        const typePrefix = chunk.type.toUpperCase();
        const sectionPrefix = chunk.metadata?.section
          ? `[SECTION: ${chunk.metadata.section}] `
          : "";
        return `${typePrefix}: ${sectionPrefix}${chunk.content.trim()}`;
      });

      // Get embeddings from VoyageAI
      const response = await embedWithRetry(inputTexts);

      if (!response?.data?.length) {
        batchSpinner.fail("No embeddings data in response");
        totalFailed += batchWithContext.length;
        continue;
      }

      // Step 4: Insert all chunks with their embeddings
      const insertPromises = batchWithContext.map(
        async ({ chunk, post, publishedDate, tags }, j) => {
          const embedding = response.data[j]?.embedding;
          if (!embedding) return false;

          const formattedEmbedding = formatEmbeddingForPostgres(embedding);
          const { frontmatter, filePath } = post;

          const enhancedMetadata = {
            ...chunk.metadata,
            post_title: frontmatter?.title || filePath,
            published_date: publishedDate,
            tags,
          };

          try {
            await sql`
            INSERT INTO content_chunks (
              id, post_slug, post_title, content, chunk_type,
              metadata, sequence, embedding
            ) VALUES (
              ${uuidv4()},
              ${filePath},
              ${frontmatter?.title || filePath},
              ${chunk.content},
              ${chunk.type},
              ${JSON.stringify(enhancedMetadata)},
              ${chunk.sequence},
              ${formattedEmbedding}
            )
          `;
            return true;
          } catch (error) {
            console.error(
              chalk.red(`Error inserting chunk for ${filePath}:`),
              error
            );
            return false;
          }
        }
      );

      const results = await Promise.all(insertPromises);
      const successCount = results.filter(Boolean).length;
      totalSuccessful += successCount;
      totalFailed += batchWithContext.length - successCount;

      const percentage = Math.round(
        ((i + batchWithContext.length) / allChunksWithContext.length) * 100
      );
      batchSpinner.succeed(
        `Batch ${batchNum}/${totalBatches}: ${successCount}/${batchWithContext.length} chunks (${percentage}% total)`
      );

      // Rate limiting delay between batches
      if (i + CROSS_POST_BATCH_SIZE < allChunksWithContext.length) {
        await wait(DELAY_BETWEEN_BATCHES);
      }
    } catch (error) {
      batchSpinner.fail(`Error processing batch: ${error}`);
      totalFailed += batchWithContext.length;
    }
  }

  return { totalSuccessful, totalFailed };
}

// Execute with proper setup and error handling
async function main() {
  try {
    await setupTable();

    // Check if a specific file was provided as an argument
    const specificFile = process.argv[2];

    if (specificFile) {
      console.log(`Processing single file: ${specificFile}`);
      const { successfulChunks, failedChunks } =
        await generateEmbeddingsForSingleFile(specificFile);

      console.log("\n=== Embedding Generation Summary ===");
      console.log(`Successful chunks: ${successfulChunks}`);
      console.log(`Failed chunks: ${failedChunks}`);
      console.log(
        `Success rate: ${(
          (successfulChunks / (successfulChunks + failedChunks)) *
          100
        ).toFixed(2)}%`
      );
    } else {
      // Existing code for processing all files
      const { totalSuccessful, totalFailed } =
        await generateEmbeddingsForAllFiles();

      console.log("\n=== Final Embedding Generation Summary ===");
      console.log(
        `Total successful chunks across all files: ${totalSuccessful}`
      );
      console.log(`Total failed chunks across all files: ${totalFailed}`);
      console.log(
        `Overall success rate: ${(
          (totalSuccessful / (totalSuccessful + totalFailed)) *
          100
        ).toFixed(2)}%`
      );
    }

    process.exit(0);
  } catch (error) {
    console.error(chalk.red("Fatal error:"), error);
    process.exit(1);
  }
}

main();
