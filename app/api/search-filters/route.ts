import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Get tags that appear in more than 1 post
    const tagsResult = await sql.query(`
      SELECT
        tag,
        COUNT(DISTINCT post_slug) as post_count
      FROM content_chunks,
      jsonb_array_elements_text(metadata->'tags') as tag
      WHERE metadata->'tags' IS NOT NULL
      GROUP BY tag
      HAVING COUNT(DISTINCT post_slug) > 1
      ORDER BY post_count DESC
    `);

    // Get available chunk types
    const chunkTypesResult = await sql.query(`
      SELECT DISTINCT chunk_type
      FROM content_chunks
      ORDER BY chunk_type
    `);

    return NextResponse.json({
      tags: tagsResult.rows.map((row) => row.tag),
      chunkTypes: chunkTypesResult.rows.map((row) => row.chunk_type),
    });
  } catch (error) {
    console.error("Error fetching search filters:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch filters",
      },
      { status: 500 }
    );
  }
}
