/**
 * Unified Vector Database Analysis Tool
 *
 * Comprehensive diagnostics for the chunking and embedding system.
 * Combines the best parts of the previous analysis scripts into one
 * clean, useful debugging tool.
 *
 * Usage: pnpm run analyze-vector-db
 */

import * as dotenv from "dotenv";
dotenv.config();

import { sql } from "@vercel/postgres";
import * as fs from "fs";
import * as path from "path";

interface ChunkTypeStats {
  type: string;
  count: number;
  percentage: number;
  avgLength: number;
  minLength: number;
  maxLength: number;
  avgWords: number;
  tinyCount: number; // < 50 chars
  tinyPercentage: number;
}

async function getOverallStats() {
  console.log("=== OVERALL STATISTICS ===\n");

  const totals = await sql`
    SELECT
      COUNT(*) as total_chunks,
      COUNT(DISTINCT post_slug) as total_posts,
      AVG(LENGTH(content))::int as avg_length,
      MIN(LENGTH(content)) as min_length,
      MAX(LENGTH(content)) as max_length
    FROM content_chunks
    WHERE embedding IS NOT NULL
  `;

  const { total_chunks, total_posts, avg_length, min_length, max_length } =
    totals.rows[0];

  console.log(`Total chunks: ${total_chunks}`);
  console.log(`Total posts: ${total_posts}`);
  console.log(
    `Chunks per post (avg): ${(total_chunks / total_posts).toFixed(1)}\n`
  );

  console.log("Character Length:");
  console.log(`  Average: ${avg_length} chars`);
  console.log(`  Range: ${min_length} - ${max_length} chars\n`);

  // Length distribution
  const dist = await sql`
    SELECT
      COUNT(CASE WHEN LENGTH(content) < 50 THEN 1 END) as tiny,
      COUNT(CASE WHEN LENGTH(content) >= 50 AND LENGTH(content) < 150 THEN 1 END) as small,
      COUNT(CASE WHEN LENGTH(content) >= 150 AND LENGTH(content) < 400 THEN 1 END) as medium,
      COUNT(CASE WHEN LENGTH(content) >= 400 AND LENGTH(content) < 600 THEN 1 END) as large,
      COUNT(CASE WHEN LENGTH(content) >= 600 THEN 1 END) as very_large
    FROM content_chunks
    WHERE embedding IS NOT NULL
  `;

  const d = dist.rows[0];
  const pct = (count: number) =>
    ((count / Number(total_chunks)) * 100).toFixed(1);

  console.log("Length Distribution:");
  console.log(
    `  Tiny    (<50):     ${String(d.tiny).padStart(5)} (${pct(d.tiny)}%)`
  );
  console.log(
    `  Small   (50-150):  ${String(d.small).padStart(5)} (${pct(d.small)}%)`
  );
  console.log(
    `  Medium  (150-400): ${String(d.medium).padStart(5)} (${pct(d.medium)}%)`
  );
  console.log(
    `  Large   (400-600): ${String(d.large).padStart(5)} (${pct(d.large)}%)`
  );
  console.log(
    `  V.Large (600+):    ${String(d.very_large).padStart(5)} (${pct(d.very_large)}%)\n`
  );
}

async function getChunkTypeStats(): Promise<ChunkTypeStats[]> {
  console.log("=== CHUNK TYPE ANALYSIS ===\n");

  const types = await sql`
    SELECT
      chunk_type,
      COUNT(*) as count,
      AVG(LENGTH(content))::int as avg_length,
      MIN(LENGTH(content)) as min_length,
      MAX(LENGTH(content)) as max_length,
      COUNT(CASE WHEN LENGTH(content) < 50 THEN 1 END) as tiny_count
    FROM content_chunks
    WHERE embedding IS NOT NULL
    GROUP BY chunk_type
    ORDER BY count DESC
  `;

  const totalChunks = types.rows.reduce(
    (sum, row) => sum + parseInt(row.count),
    0
  );

  const stats: ChunkTypeStats[] = types.rows.map((row) => ({
    type: row.chunk_type,
    count: parseInt(row.count),
    percentage: (parseInt(row.count) / totalChunks) * 100,
    avgLength: parseInt(row.avg_length),
    minLength: parseInt(row.min_length),
    maxLength: parseInt(row.max_length),
    avgWords: 0, // Calculate separately if needed
    tinyCount: parseInt(row.tiny_count),
    tinyPercentage: (parseInt(row.tiny_count) / parseInt(row.count)) * 100,
  }));

  stats.forEach((s) => {
    console.log(`${s.type.toUpperCase()}`);
    console.log(`  Count: ${s.count} (${s.percentage.toFixed(1)}%)`);
    console.log(
      `  Length: avg ${s.avgLength}, range ${s.minLength}-${s.maxLength}`
    );
    console.log(
      `  Quality: ${s.tinyPercentage.toFixed(1)}% are tiny (<50 chars)\n`
    );
  });

  return stats;
}

async function getPerPostStats() {
  console.log("=== PER-POST DISTRIBUTION ===\n");

  const perPost = await sql`
    SELECT
      post_slug,
      COUNT(*) as chunk_count,
      AVG(LENGTH(content))::int as avg_length
    FROM content_chunks
    WHERE embedding IS NOT NULL
    GROUP BY post_slug
    ORDER BY chunk_count DESC
    LIMIT 20
  `;

  console.log("Top 20 posts by chunk count:\n");
  console.log(
    "SLUG".padEnd(30) +
      " | " +
      "CHUNKS".padStart(6) +
      " | " +
      "AVG LEN".padStart(7)
  );
  console.log("-".repeat(50));

  perPost.rows.forEach((row) => {
    console.log(
      `${row.post_slug.padEnd(30)} | ${String(row.chunk_count).padStart(6)} | ${String(row.avg_length).padStart(7)}`
    );
  });

  console.log("\n");

  // Check for posts with very few chunks
  const fewChunks = await sql`
    SELECT post_slug, COUNT(*) as chunk_count
    FROM content_chunks
    WHERE embedding IS NOT NULL
    GROUP BY post_slug
    HAVING COUNT(*) < 2
    ORDER BY chunk_count
  `;

  if (fewChunks.rows.length > 0) {
    console.log(
      `⚠️  ${fewChunks.rows.length} posts have fewer than 2 chunks (missing full-post?):`
    );
    fewChunks.rows.slice(0, 10).forEach((row) => {
      console.log(`   - ${row.post_slug}: ${row.chunk_count} chunk(s)`);
    });
    console.log("\n");
  }
}

async function findProblematicChunks() {
  console.log("=== PROBLEMATIC CHUNKS ===\n");

  // Very tiny chunks
  const tiny = await sql`
    SELECT post_slug, chunk_type, content, LENGTH(content) as len
    FROM content_chunks
    WHERE LENGTH(content) < 50
      AND embedding IS NOT NULL
      AND chunk_type != 'heading'
    ORDER BY len ASC
    LIMIT 10
  `;

  if (tiny.rows.length > 0) {
    console.log(
      `Found ${tiny.rows.length} chunks < 50 chars (excluding headings):\n`
    );
    tiny.rows.forEach((row, i) => {
      const preview =
        row.content.length > 60
          ? row.content.substring(0, 60) + "..."
          : row.content;
      console.log(
        `${i + 1}. [${row.post_slug}] ${row.chunk_type} - ${row.len} chars`
      );
      console.log(`   "${preview}"\n`);
    });
  } else {
    console.log("✅ No tiny chunks found!\n");
  }
}

async function checkDatabaseHealth() {
  console.log("=== DATABASE HEALTH CHECK ===\n");

  // Check for missing full-post chunks
  const postsDir = path.join(process.cwd(), "posts");
  const allPostSlugs = fs
    .readdirSync(postsDir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => path.basename(f, ".md"));

  const fullPostChunks = await sql`
    SELECT DISTINCT post_slug
    FROM content_chunks
    WHERE chunk_type = 'full-post'
      AND embedding IS NOT NULL
  `;

  const slugsWithFullPost = new Set(
    fullPostChunks.rows.map((r) => r.post_slug)
  );
  const missingFullPost = allPostSlugs.filter(
    (slug) => !slugsWithFullPost.has(slug)
  );

  if (missingFullPost.length > 0) {
    console.log(
      `⚠️  ${missingFullPost.length} posts missing full-post chunks:`
    );
    missingFullPost.slice(0, 10).forEach((slug) => {
      console.log(`   - ${slug}`);
    });
    if (missingFullPost.length > 10) {
      console.log(`   ... and ${missingFullPost.length - 10} more`);
    }
    console.log("\n");
  } else {
    console.log("✅ All posts have full-post chunks\n");
  }

  // Check for null embeddings
  const nullEmbeddings = await sql`
    SELECT COUNT(*) as count
    FROM content_chunks
    WHERE embedding IS NULL
  `;

  const nullCount = parseInt(nullEmbeddings.rows[0].count);
  if (nullCount > 0) {
    console.log(`⚠️  ${nullCount} chunks have NULL embeddings\n`);
  } else {
    console.log("✅ All chunks have embeddings\n");
  }
}

async function provideRecommendations(stats: ChunkTypeStats[]) {
  console.log("=== RECOMMENDATIONS ===\n");

  const fullPostStats = stats.find((s) => s.type === "full-post");
  const totalChunks = stats.reduce((sum, s) => sum + s.count, 0);

  console.log("Expected chunk types (in order of importance):");
  console.log("  1. full-post  - One per post (for similar posts)");
  console.log("  2. section    - Heading + content (for structured posts)");
  console.log("  3. quote      - Block quotes (for wisdom search)");
  console.log("  4. code       - Code blocks (for technical snippets)\n");

  if (!fullPostStats) {
    console.log("❌ No full-post chunks found! Run embedding generation.");
  } else if (fullPostStats.tinyPercentage > 1) {
    console.log(
      `⚠️  ${fullPostStats.tinyPercentage.toFixed(1)}% of full-post chunks are tiny`
    );
    console.log(
      "   This shouldn't happen - investigate short posts or chunking issues."
    );
  } else {
    console.log(
      `✅ Full-post chunks look good (${fullPostStats.count} chunks, ${fullPostStats.tinyPercentage.toFixed(1)}% tiny)`
    );
  }

  console.log("\n");

  const tinyPercentage =
    stats.reduce((sum, s) => sum + s.tinyCount, 0) / totalChunks;

  if (tinyPercentage * 100 > 10) {
    console.log(
      `⚠️  Overall ${(tinyPercentage * 100).toFixed(1)}% of chunks are < 50 chars`
    );
    console.log(
      "   Consider increasing MIN_CHUNK_LENGTH in config/constants.ts"
    );
  } else {
    console.log(
      `✅ Overall chunk quality is good (${(tinyPercentage * 100).toFixed(1)}% tiny)`
    );
  }
}

async function main() {
  try {
    await getOverallStats();
    const stats = await getChunkTypeStats();
    await getPerPostStats();
    await findProblematicChunks();
    await checkDatabaseHealth();
    await provideRecommendations(stats);

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
