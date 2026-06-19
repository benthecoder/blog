import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.POSTGRES_URL!);

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawCursor = searchParams.get("cursor");
    const rawLimit = parseInt(searchParams.get("limit") ?? "100", 10);
    const limit = Number.isFinite(rawLimit)
      ? Math.min(Math.max(1, rawLimit), 200)
      : 100;

    const cursor =
      rawCursor !== null && /^\d+$/.test(rawCursor)
        ? parseInt(rawCursor, 10)
        : null;

    const thoughts =
      cursor !== null
        ? await sql`
            SELECT id, content, created_at
            FROM tweets
            WHERE id < ${cursor}
            ORDER BY id DESC
            LIMIT ${limit}
          `
        : await sql`
            SELECT id, content, created_at
            FROM tweets
            ORDER BY id DESC
            LIMIT ${limit}
          `;

    return NextResponse.json(thoughts);
  } catch (error) {
    console.error("Error fetching thoughts:", error);
    return NextResponse.json(
      { error: "Failed to fetch thoughts" },
      { status: 500 }
    );
  }
}
