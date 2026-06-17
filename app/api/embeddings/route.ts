import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { computeUMAP, normalizePositions } from "@/utils/chunking/umapUtils";
import { parseEmbedding } from "@/utils/chunking/embeddingUtils";
import type { ChunkRow } from "@/types/chunks";

export const revalidate = 3600;

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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const nNeighbors = parseInt(searchParams.get("neighbors") || "8");
    const minDist = parseFloat(searchParams.get("minDist") || "0.05");
    const spread = parseFloat(searchParams.get("spread") || "2.0");

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

    const normalizedPositions = normalizePositions(
      umapPositions,
      1000,
      1000,
      50
    );

    const processedData = parsedData.map((item, index) => ({
      id: item.id,
      postSlug: item.postSlug,
      postTitle: item.postTitle,
      content: item.content,
      chunkType: item.chunkType,
      metadata: item.metadata,
      sequence: item.sequence,
      publishedDate: item.publishedDate,
      tags: item.tags,
      createdAt: item.createdAt,
      index,
      x: normalizedPositions[index].x,
      y: normalizedPositions[index].y,
      // embedding vectors intentionally omitted — large and unused by clients
    }));

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
