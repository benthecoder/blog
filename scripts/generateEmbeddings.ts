// Configure environment variables BEFORE any imports that use them
import * as dotenv from "dotenv";
dotenv.config();

// POSTGRES_URL is required for Vercel postgres
if (!process.env.POSTGRES_URL) {
  throw new Error("POSTGRES_URL environment variable is required");
}

// Now import modules that depend on environment variables
import { processAllPosts, processPost } from "@/utils/chunking/processPosts";
import { Client, neon } from "@neondatabase/serverless";
const sql = neon(process.env.POSTGRES_URL!);
import chalk from "chalk";
import ora from "ora";

import { getVoyageClient } from "@/utils/clients";
import { prepareEmbeddings } from "@/utils/chunking/prepareEmbeddings";
import { replaceEmbeddings } from "@/utils/chunking/replaceEmbeddings";
import { withEmbeddingRetry, wait } from "@/utils/retry";
import { DELAY_BETWEEN_BATCHES, VOYAGE_MODEL } from "@/config/constants";

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
    if (!(tableExists[0] as Record<string, boolean>).exists) {
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

async function main() {
  const specificFile = process.argv[2];
  const posts = specificFile
    ? [await processPost(specificFile)]
    : await processAllPosts();
  const client = getVoyageClient();
  const spinner = ora(
    "Preparing embeddings; existing search index stays available..."
  ).start();
  let rows;
  try {
    rows = await prepareEmbeddings(
      posts,
      (texts) =>
        withEmbeddingRetry(() =>
          client.embed({
            model: VOYAGE_MODEL,
            input: texts,
            inputType: "document",
          })
        ),
      specificFile ? 50 : 120,
      () => wait(DELAY_BETWEEN_BATCHES)
    );
    spinner.succeed(
      `Prepared ${rows.length} chunks from ${posts.length} posts`
    );
  } catch (error) {
    spinner.fail("Embedding preparation failed; existing index preserved");
    throw error;
  }

  await setupTable();
  const database = new Client({ connectionString: process.env.POSTGRES_URL });
  try {
    await database.connect();
    await replaceEmbeddings(
      database,
      rows,
      specificFile ? posts[0].filePath : undefined
    );
    console.log(chalk.green(`Replaced ${rows.length} chunks atomically`));
  } finally {
    await database.end();
  }
}

main().catch((error) => {
  console.error(chalk.red("Embedding generation failed:"), error);
  process.exitCode = 1;
});
