// Configure environment variables BEFORE any imports that use them
import * as dotenv from "dotenv";
dotenv.config();

// Ensure POSTGRES_URL is set (Vercel postgres needs this specific var name)
if (!process.env.POSTGRES_URL && process.env.DATABASE_URL) {
  process.env.POSTGRES_URL = process.env.DATABASE_URL;
}

// Now import modules that depend on environment variables
import { sql } from "@vercel/postgres";
import * as fs from "fs";
import * as path from "path";
import { POSTS_DIR } from "@/config/paths";
import { DELAY_BETWEEN_FILES } from "@/config/constants";
import { wait } from "@/utils/retry";

// Import the single file generator from generateEmbeddings
// We'll need to extract it or import it if it's exported
import { processAllPosts } from "@/utils/processAllPosts";

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

    if (!tableExists.rows[0].exists) {
      console.log("Creating content_chunks table...");
      await sql`
        CREATE TABLE content_chunks (
          id UUID PRIMARY KEY,
          post_slug TEXT NOT NULL,
          post_title TEXT NOT NULL,
          content TEXT NOT NULL,
          chunk_type TEXT NOT NULL,
          metadata JSONB NOT NULL,
          sequence INTEGER NOT NULL,
          embedding vector(1024),
          overlaps_with UUID[],
          overlap_score FLOAT[],
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `;
      console.log("✅ Table created");
    }
  } catch (error) {
    console.error("Error setting up table:", error);
    throw error;
  }
};

async function getMissingPosts(): Promise<string[]> {
  try {
    // Get all unique post slugs from the database
    const result = await sql`
      SELECT DISTINCT post_slug FROM content_chunks
    `;

    const embeddedSlugs = new Set(result.rows.map((row) => row.post_slug));

    console.log(
      `Found ${embeddedSlugs.size} posts with embeddings in database`
    );

    // Get all markdown files from posts directory
    const allFiles = fs
      .readdirSync(POSTS_DIR)
      .filter((file) => file.endsWith(".md"))
      .map((file) => file.replace(/\.md$/, ""));

    console.log(`Found ${allFiles.length} total posts in ${POSTS_DIR}`);

    // Find posts that don't have embeddings
    const missingPosts = allFiles.filter((slug) => !embeddedSlugs.has(slug));

    console.log(`Found ${missingPosts.length} posts missing embeddings:`);
    if (missingPosts.length > 0) {
      console.log(missingPosts.join(", "));
    }

    return missingPosts;
  } catch (error) {
    console.error("Error finding missing posts:", error);
    throw error;
  }
}

function createProgressBar(current: number, total: number): string {
  const percentage = Math.round((current / total) * 100);
  const filledLength = Math.round((current / total) * 30);
  const progressBar = "█".repeat(filledLength) + "░".repeat(30 - filledLength);
  return `[${progressBar}] ${percentage}% (${current}/${total})`;
}

async function main() {
  try {
    console.log("=== Backfilling Missing Embeddings ===\n");

    await setupTable();

    const missingPosts = await getMissingPosts();

    if (missingPosts.length === 0) {
      console.log("\n✅ All posts already have embeddings!");
      process.exit(0);
    }

    console.log(
      `\n🚀 Starting to generate embeddings for ${missingPosts.length} missing posts...\n`
    );

    let totalSuccessful = 0;
    let totalFailed = 0;

    for (let i = 0; i < missingPosts.length; i++) {
      const slug = missingPosts[i];
      console.log(
        `\n=== Processing ${i + 1}/${missingPosts.length}: ${slug} ===`
      );

      try {
        // Import and use the single file generator
        // For now we'll use npx tsx to call the existing script
        const { execSync } = require("child_process");

        execSync(`npx tsx scripts/generateEmbeddings.ts "${slug}"`, {
          stdio: "inherit",
          cwd: process.cwd(),
        });

        totalSuccessful++;
        console.log(`✅ Successfully embedded ${slug}`);
      } catch (error) {
        console.error(`❌ Failed to embed ${slug}:`, error);
        totalFailed++;
      }

      // Update progress
      console.log(createProgressBar(i + 1, missingPosts.length));

      // Add delay between files
      if (i < missingPosts.length - 1) {
        console.log(`Waiting ${DELAY_BETWEEN_FILES}ms before next file...`);
        await wait(DELAY_BETWEEN_FILES);
      }
    }

    console.log("\n=== Backfill Complete ===");
    console.log(`✅ Successful: ${totalSuccessful}`);
    console.log(`❌ Failed: ${totalFailed}`);
    console.log(
      `Success rate: ${((totalSuccessful / (totalSuccessful + totalFailed)) * 100).toFixed(2)}%`
    );

    process.exit(totalFailed > 0 ? 1 : 0);
  } catch (error) {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  }
}

main();
