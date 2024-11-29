import { processAllPosts } from '../utils/processAllPosts';
import { sql } from '@vercel/postgres';
import { v4 as uuidv4 } from 'uuid';
import { VoyageAIClient } from 'voyageai';
import * as dotenv from 'dotenv';

dotenv.config();

interface EmbeddingResult {
  successfulChunks: number;
  failedChunks: number;
}

process.env.POSTGRES_URL = process.env.DATABASE_URL;

const client = new VoyageAIClient({
  apiKey: process.env.VOYAGE_AI_API_KEY!,
});

// Constants for rate limiting and batching
const BATCH_SIZE = 20; // Reduced batch size
const DELAY_BETWEEN_BATCHES = 200; // Increased delay between batches
const DELAY_BETWEEN_FILES = 1000; // New: delay between files
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;

const setupTable = async () => {
  try {
    // Create extension in separate command
    await sql`CREATE EXTENSION IF NOT EXISTS vector;`;

    // Drop table in separate command
    try {
      await sql`DROP TABLE IF EXISTS content_chunks;`;
    } catch (error) {
      console.log('Table did not exist, creating new one');
    }

    // Create table in separate command
    await sql`
      CREATE TABLE content_chunks (
        id UUID PRIMARY KEY,
        post_slug TEXT,
        post_title TEXT,
        content TEXT,
        chunk_type TEXT,
        metadata JSONB,
        sequence INTEGER,
        embedding vector(512),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create indexes in separate commands
    await sql`CREATE INDEX idx_content_chunks_post_slug ON content_chunks(post_slug);`;
    await sql`CREATE INDEX idx_content_chunks_chunk_type ON content_chunks(chunk_type);`;

    console.log('✅ Table setup complete');
  } catch (error) {
    console.error('Error setting up table:', error);
    throw error;
  }
};

async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function embedWithRetry(texts: string[], retryCount = 0): Promise<any> {
  try {
    return await client.embed({
      model: 'voyage-3-lite',
      input: texts,
      inputType: 'document',
    });
  } catch (error: any) {
    if (error?.response?.status === 429 && retryCount < MAX_RETRIES) {
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
      console.log(
        `Rate limited. Waiting ${delay}ms before retry ${
          retryCount + 1
        }/${MAX_RETRIES}`
      );
      await wait(delay);
      return embedWithRetry(texts, retryCount + 1);
    }
    throw error;
  }
}

async function generateEmbeddingsForSingleFile(
  filePath: string
): Promise<EmbeddingResult> {
  const posts = await processAllPosts();
  const post = posts.find((p) => p.filePath === filePath);

  if (!post) {
    console.error(`File ${filePath} not found`);
    return { successfulChunks: 0, failedChunks: 0 };
  }

  const { frontmatter, chunks } = post;
  let successfulChunks = 0;
  let failedChunks = 0;

  console.log(`\nProcessing ${filePath} with ${chunks.length} chunks`);

  // Process in batches
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batchChunks = chunks.slice(i, i + BATCH_SIZE);
    const batchEnd = Math.min(i + BATCH_SIZE, chunks.length);

    console.log(`\nProcessing batch ${i}-${batchEnd} of ${chunks.length}`);

    try {
      const inputTexts = batchChunks.map(
        (chunk) => `${chunk.type.toUpperCase()}: ${chunk.content.trim()}`
      );

      // Log batch info without flooding console
      console.log(`Batch size: ${inputTexts.length} chunks`);

      const response = await embedWithRetry(inputTexts);

      if (!response?.data?.length) {
        console.error('No embeddings data in response');
        failedChunks += batchChunks.length;
        continue;
      }

      // Insert chunks in parallel for better performance
      const insertPromises = batchChunks.map(async (chunk, j) => {
        const embedding = response.data[j].embedding;
        const formattedEmbedding = `[${embedding.join(',')}]`;

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
              ${JSON.stringify(chunk.metadata || {})},
              ${chunk.metadata?.sequence || j},
              ${formattedEmbedding}
            )
          `;
          return true;
        } catch (error) {
          console.error('Error inserting chunk:', error);
          return false;
        }
      });

      const results = await Promise.all(insertPromises);
      const successCount = results.filter(Boolean).length;
      successfulChunks += successCount;
      failedChunks += batchChunks.length - successCount;

      console.log(
        `✅ Batch complete: ${successCount}/${batchChunks.length} chunks successful`
      );

      // Add delay between batches to avoid rate limits
      await wait(DELAY_BETWEEN_BATCHES);
    } catch (error) {
      console.error('Error processing batch:', error);
      failedChunks += batchChunks.length;
    }
  }

  return { successfulChunks, failedChunks };
}

async function generateEmbeddingsForAllFiles() {
  const posts = await processAllPosts();
  let totalSuccessful = 0;
  let totalFailed = 0;

  console.log(`\nProcessing ${posts.length} files in total`);

  for (const post of posts) {
    console.log(`\n=== Processing file: ${post.filePath} ===`);

    const { successfulChunks, failedChunks } =
      await generateEmbeddingsForSingleFile(post.filePath);

    totalSuccessful += successfulChunks;
    totalFailed += failedChunks;

    // Add delay between files
    console.log(`Waiting ${DELAY_BETWEEN_FILES}ms before next file...`);
    await wait(DELAY_BETWEEN_FILES);
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

      console.log('\n=== Embedding Generation Summary ===');
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

      console.log('\n=== Final Embedding Generation Summary ===');
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
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

main();
