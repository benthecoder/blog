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
import * as fs from "fs";
import matter from "gray-matter";

// Import shared utilities
import { getVoyageClient } from "@/utils/clients";
import { formatEmbeddingForPostgres } from "@/utils/embeddingUtils";
import { withEmbeddingRetry, wait } from "@/utils/retry";
import { extractPostDate, toISODateString } from "@/utils/dateUtils";
import { extractTags } from "@/utils/postUtils";
import { POSTS_DIR } from "@/config/paths";
import {
  EMBEDDING_DIMENSIONS,
  EMBEDDING_BATCH_SIZE,
  DELAY_BETWEEN_BATCHES,
  DELAY_BETWEEN_FILES,
  MAX_WHOLE_POST_LENGTH,
  OVERLAP_DETECTION_THRESHOLD,
} from "@/config/constants";

// Import types
import { PostFrontmatter } from "@/types/post";

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

      // Create table with simpler schema, keeping everything in metadata
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
          overlaps_with UUID[], /* Array of chunk IDs this chunk overlaps with */
          overlap_score FLOAT[], /* Corresponding overlap percentage/score */
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `;

      // Create indexes in separate commands
      await sql`CREATE INDEX idx_content_chunks_post_slug ON content_chunks(post_slug);`;
      await sql`CREATE INDEX idx_content_chunks_chunk_type ON content_chunks(chunk_type);`;
      await sql`CREATE INDEX idx_content_chunks_published_date ON content_chunks((metadata->>'published_date'));`; // JSON path index
      await sql`CREATE INDEX idx_overlaps_with ON content_chunks USING GIN(overlaps_with);`;

      console.log("✅ Table created successfully with all indexes");
    } else {
      console.log("✅ Table already exists, skipping creation");
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
      model: "voyage-3-lite",
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
    console.log(`✅ Previous embeddings removed`);
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

  // Create a whole-post context for better document-level embedding
  let wholePostEmbeddingDone = false;

  // Get the full content of the post
  try {
    const fullFilePath = `${POSTS_DIR}/${filePath}.md`;

    if (fs.existsSync(fullFilePath)) {
      const fileContent = fs.readFileSync(fullFilePath, "utf8");
      const { content } = matter(fileContent);

      // Only embed whole post if it's not too long
      if (content.length <= MAX_WHOLE_POST_LENGTH) {
        const wholePostText = `FULL POST: ${content.trim()}`;
        const wholePostResponse = await embedWithRetry([wholePostText]);

        if (wholePostResponse?.data?.length) {
          const embedding = wholePostResponse.data[0].embedding;
          const formattedEmbedding = formatEmbeddingForPostgres(embedding);

          // Enhanced metadata (non-date/tag specific info remains in metadata)
          interface WholePostMetadata {
            is_whole_post: boolean;
            word_count: number;
            title: string;
            published_date?: string;
            tags?: string[];
          }

          const enhancedMetadata: WholePostMetadata = {
            is_whole_post: true,
            word_count: content.split(/\s+/).length,
            title: frontmatter?.title || filePath,
          };

          // Treat frontmatter as proper type
          const typedFrontmatter = frontmatter as PostFrontmatter;

          // Extract tags as array using shared utility
          const tagsArray = extractTags(typedFrontmatter);

          try {
            // Add published_date to metadata
            enhancedMetadata.published_date = formattedPublishedDate;
            enhancedMetadata.tags = tagsArray;

            const wholePostId = uuidv4();
            await sql`
              INSERT INTO content_chunks (
                id, post_slug, post_title, content, chunk_type, 
                metadata, sequence, embedding, overlaps_with, overlap_score
              ) VALUES (
                ${wholePostId},
                ${filePath},
                ${frontmatter?.title || filePath},
                ${
                  content.length > 2000
                    ? content.substring(0, 2000) + "..."
                    : content
                },
                ${"full-post"},
                ${JSON.stringify(enhancedMetadata)},
                ${0}, /* Whole post is always first */
                ${formattedEmbedding},
                ${null}, /* Initialize with NULL instead of empty array */
                ${null}  /* Initialize with NULL instead of empty array */
              )
            `;
            successfulChunks++;
            wholePostEmbeddingDone = true;
            console.log("✅ Whole post embedding complete");
          } catch (error) {
            console.error("Error inserting whole post chunk:", error);
            failedChunks++;

            // Update chunk progress after error
            console.log(updateChunkProgress());
          }
        }
      }
    }
  } catch (error) {
    console.error("Error processing whole post:", error);
    // Continue with chunk processing even if whole post fails
  }

  // Process chunks in batches
  for (let i = 0; i < chunks.length; i += EMBEDDING_BATCH_SIZE) {
    const batchChunks = chunks.slice(i, i + EMBEDDING_BATCH_SIZE);
    const batchEnd = Math.min(i + EMBEDDING_BATCH_SIZE, chunks.length);

    console.log(
      `\nProcessing batch ${i}-${batchEnd} of ${chunks.length} (${Math.ceil(
        (batchEnd - i) / EMBEDDING_BATCH_SIZE
      )}/${Math.ceil(chunks.length / EMBEDDING_BATCH_SIZE)} batches)`
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
              metadata, sequence, embedding, overlaps_with, overlap_score
            ) VALUES (
              ${chunkIds[j]},
              ${filePath},
              ${frontmatter?.title || filePath},
              ${chunk.content},
              ${chunk.type},
              ${JSON.stringify(enhancedMetadata)},
              ${
                wholePostEmbeddingDone
                  ? chunk.metadata?.sequence || j + 1
                  : chunk.metadata?.sequence || j
              },
              ${formattedEmbedding},
              ${null}, /* Initialize with NULL instead of empty array */
              ${null}  /* Initialize with NULL instead of empty array */
            )
          `;
          return true;
        } catch (error) {
          console.error("Error inserting chunk:", error);
          return false;
        }
      });

      // Second pass: Analyze and record overlaps between sequential chunks
      const updateOverlapPromises = batchChunks.map(async (chunk, j) => {
        if (j === 0) return true; // Skip first chunk

        const currentChunk = chunk.content;
        const prevChunk = batchChunks[j - 1].content;

        // Calculate overlap
        let overlapScore = 0;
        let overlapFound = false;

        // Simple overlap detection
        // Check if end of previous chunk is in current chunk
        const prevChunkEnd = prevChunk.substring(
          Math.max(0, prevChunk.length - OVERLAP_DETECTION_THRESHOLD)
        );
        if (currentChunk.includes(prevChunkEnd)) {
          overlapScore = prevChunkEnd.length / currentChunk.length;
          overlapFound = true;
        }

        if (overlapFound) {
          try {
            // Update current chunk with reference to previous
            await sql`
              UPDATE content_chunks 
              SET overlaps_with = array_append(overlaps_with, ${
                chunkIds[j - 1]
              }),
                  overlap_score = array_append(overlap_score, ${overlapScore})
              WHERE id = ${chunkIds[j]}
            `;

            // Update previous chunk with reference to current
            await sql`
              UPDATE content_chunks 
              SET overlaps_with = array_append(overlaps_with, ${chunkIds[j]}),
                  overlap_score = array_append(overlap_score, ${overlapScore})
              WHERE id = ${chunkIds[j - 1]}
            `;
          } catch (error) {
            console.error("Error updating overlap:", error);
          }
        }

        return true;
      });

      // Wait for inserts to complete
      const results = await Promise.all(insertPromises);
      const successCount = results.filter(Boolean).length;

      // Update counters based on results
      successfulChunks += successCount;
      failedChunks += batchChunks.length - successCount;

      // Process overlaps after all inserts completed
      if (successCount > 1) {
        // Only process overlaps if we have at least 2 chunks
        await Promise.all(updateOverlapPromises);
        console.log(`✅ Processed overlaps between chunks`);
      }

      // Update chunk progress
      console.log(updateChunkProgress());

      console.log(
        `✅ Batch complete: ${successCount}/${batchChunks.length} chunks successful with sliding window overlaps`
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
 * Creates a simple ASCII progress bar
 */
function createProgressBar(
  current: number,
  total: number,
  width: number = 30
): string {
  const percentage = Math.round((current / total) * 100);
  const progressChars = Math.round((current / total) * width);
  const progressBar =
    "█".repeat(progressChars) + "░".repeat(width - progressChars);
  return `[${progressBar}] ${percentage}% (${current}/${total})`;
}

async function generateEmbeddingsForAllFiles() {
  const posts = await processAllPosts();
  const nonDraftPosts = posts.filter(
    (post) => !post.filePath.includes("/drafts/")
  );

  let totalSuccessful = 0;
  let totalFailed = 0;
  const totalFiles = nonDraftPosts.length;

  console.log(`\nProcessing ${totalFiles} files in total`);
  console.log(createProgressBar(0, totalFiles));

  for (let i = 0; i < nonDraftPosts.length; i++) {
    const post = nonDraftPosts[i];
    console.log(
      `\n=== Processing file ${i + 1}/${totalFiles}: ${post.filePath} ===`
    );

    const { successfulChunks, failedChunks } =
      await generateEmbeddingsForSingleFile(post.filePath);

    totalSuccessful += successfulChunks;
    totalFailed += failedChunks;

    // Update progress bar
    console.log(createProgressBar(i + 1, totalFiles));

    // Add delay between files
    if (i < nonDraftPosts.length - 1) {
      console.log(`Waiting ${DELAY_BETWEEN_FILES}ms before next file...`);
      await wait(DELAY_BETWEEN_FILES);
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
    console.error("❌ Fatal error:", error);
    process.exit(1);
  }
}

main();
