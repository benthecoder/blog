import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { unstable_cacheLife as cacheLife } from "next/cache";
import { computeUMAP, normalizePositions } from "@/utils/umapUtils";

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

// Cached function to fetch and compute embeddings
async function getEmbeddingsData(
  nNeighbors: number,
  minDist: number,
  spread: number
) {
  "use cache";
  cacheLife("hours");

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

  const embeddings = parsedData.map((item) => item.embedding);
  const umapPositions = computeUMAP(embeddings, {
    nNeighbors: Math.min(nNeighbors, parsedData.length - 1),
    minDist,
    spread,
  });

  const normalizedPositions = normalizePositions(umapPositions, 1000, 1000, 50);

  const processedData: ArticleData[] = parsedData.map((item, index) => ({
    ...item,
    x: normalizedPositions[index].x,
    y: normalizedPositions[index].y,
  }));

  return processedData;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const nNeighbors = parseInt(searchParams.get("neighbors") || "8");
    const minDist = parseFloat(searchParams.get("minDist") || "0.05");
    const spread = parseFloat(searchParams.get("spread") || "2.0");

    const processedData = await getEmbeddingsData(nNeighbors, minDist, spread);

    return NextResponse.json({
      success: true,
      data: processedData,
      count: processedData.length,
    });
  } catch (error) {
    console.error("Error fetching embeddings:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch embeddings data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
