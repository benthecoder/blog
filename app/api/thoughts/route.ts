import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { parseRows, thoughtRowSchema } from "@/utils/thoughts";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get("q") ?? "").trim();
    if (query.length > 200) {
      return NextResponse.json(
        { error: "Search is limited to 200 characters" },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }
    const rawCursor = searchParams.get("cursor");
    if (
      rawCursor !== null &&
      (!/^\d+$/.test(rawCursor) || !Number.isSafeInteger(Number(rawCursor)))
    ) {
      return NextResponse.json(
        { error: "Invalid cursor" },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }
    const rawLimit = parseInt(searchParams.get("limit") ?? "100", 10);
    const limit = Number.isFinite(rawLimit)
      ? Math.min(Math.max(1, rawLimit), 200)
      : 100;

    const cursor = rawCursor !== null ? Number(rawCursor) : null;
    const sql = neon(process.env.POSTGRES_URL!, {
      fetchOptions: {
        signal: AbortSignal.any([request.signal, AbortSignal.timeout(10_000)]),
      },
    });

    const thoughts = query
      ? cursor !== null
        ? await sql`
            SELECT id, content, link, link_title, created_at FROM tweets
            WHERE id < ${cursor}
              AND STRPOS(LOWER(CONCAT_WS(' ', content, link, link_title)), LOWER(${query})) > 0
            ORDER BY id DESC LIMIT ${limit}
          `
        : await sql`
            SELECT id, content, link, link_title, created_at FROM tweets
            WHERE STRPOS(LOWER(CONCAT_WS(' ', content, link, link_title)), LOWER(${query})) > 0
            ORDER BY id DESC LIMIT ${limit}
          `
      : cursor !== null
        ? await sql`
            SELECT id, content, link, link_title, created_at FROM tweets
            WHERE id < ${cursor} ORDER BY id DESC LIMIT ${limit}
          `
        : await sql`
            SELECT id, content, link, link_title, created_at FROM tweets
            ORDER BY id DESC LIMIT ${limit}
          `;

    // Public data only. Browsers recheck; shared caches absorb repeated reads.
    return NextResponse.json(
      parseRows(thoughtRowSchema, thoughts, "thoughts feed"),
      {
        headers: {
          "Cache-Control":
            "public, max-age=0, s-maxage=60, stale-while-revalidate=60",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching thoughts:", error);
    return NextResponse.json(
      { error: "Failed to fetch thoughts" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
