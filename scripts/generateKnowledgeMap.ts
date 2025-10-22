import "dotenv/config";
import { sql } from "@vercel/postgres";
import { computeUMAP, normalizePositions } from "../utils/umapUtils";
import fs from "fs";
import path from "path";

interface ChunkRow {
  id: string;
  post_slug: string;
  post_title: string;
  content: string;
  chunk_type: string;
  metadata: {
    published_date?: string;
    tags?: string[];
  };
  sequence: number;
  embedding: unknown;
  created_at: string;
}

interface ArticleData {
  id: string;
  postSlug: string;
  postTitle: string;
  content: string;
  chunkType: string;
  metadata: ChunkRow["metadata"];
  sequence: number;
  embedding: number[];
  publishedDate?: string;
  tags: string[];
  createdAt: string;
  index: number;
  x: number;
  y: number;
}

const parseEmbedding = (embedding: unknown): number[] => {
  if (Array.isArray(embedding)) {
    return embedding;
  }

  if (typeof embedding === "string") {
    try {
      const parsed = JSON.parse(embedding);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      // Parse PostgreSQL vector format
      const cleaned = embedding.replace(/[\[\]]/g, "");
      return cleaned.split(",").map(Number);
    }
  }

  return [];
};

async function generateKnowledgeMap() {
  try {
    // Ensure POSTGRES_URL is set (Vercel postgres needs this specific var name)
    if (!process.env.POSTGRES_URL && process.env.DATABASE_URL) {
      process.env.POSTGRES_URL = process.env.DATABASE_URL;
    }

    // Check if database connection is available
    if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
      console.warn("⚠️  DATABASE_URL not available during build");
      console.warn("⚠️  Skipping knowledge map generation");
      console.warn(
        "⚠️  Knowledge map will use existing data or fail gracefully"
      );
      return;
    }

    console.log("Fetching embeddings from database...");

    const results = await sql<ChunkRow>`
      SELECT DISTINCT ON (post_slug)
        id,
        post_slug,
        post_title,
        content,
        chunk_type,
        metadata,
        sequence,
        embedding,
        created_at
      FROM content_chunks
      WHERE embedding IS NOT NULL
      ORDER BY
        post_slug,
        CASE WHEN chunk_type = 'full-post' THEN 0 ELSE 1 END,
        sequence
    `;

    console.log(`Fetched ${results.rows.length} embeddings`);

    const parsedData = results.rows
      .map((row, index) => ({
        id: row.id,
        postSlug: row.post_slug,
        postTitle: row.post_title,
        content: row.content,
        chunkType: row.chunk_type,
        metadata: row.metadata,
        sequence: row.sequence,
        embedding: parseEmbedding(row.embedding),
        publishedDate: row.metadata?.published_date,
        tags: row.metadata?.tags || [],
        createdAt: row.created_at,
        index,
      }))
      .filter((item) => item.embedding.length > 0);

    console.log("Computing UMAP positions...");

    const embeddings = parsedData.map((item) => item.embedding);
    const umapPositions = computeUMAP(embeddings, {
      nNeighbors: Math.min(8, parsedData.length - 1),
      minDist: 0.05,
      spread: 2.0,
    });

    const normalizedPositions = normalizePositions(
      umapPositions,
      1000,
      1000,
      50
    );

    const processedData: ArticleData[] = parsedData.map((item, index) => ({
      ...item,
      x: normalizedPositions[index].x,
      y: normalizedPositions[index].y,
    }));

    // Create public/data directory if it doesn't exist
    const dataDir = path.join(process.cwd(), "public", "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Write to file
    const outputPath = path.join(dataDir, "knowledge-map.json");
    fs.writeFileSync(
      outputPath,
      JSON.stringify(
        {
          success: true,
          data: processedData,
          count: processedData.length,
          generatedAt: new Date().toISOString(),
        },
        null,
        2
      )
    );

    console.log(`✓ Knowledge map generated: ${outputPath}`);
    console.log(`  ${processedData.length} articles processed`);
  } catch (error) {
    console.error("Error generating knowledge map:", error);
    process.exit(1);
  }
}

generateKnowledgeMap();
