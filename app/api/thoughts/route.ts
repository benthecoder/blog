import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.POSTGRES_URL!);

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawOffset = parseInt(searchParams.get("offset") ?? "0", 10);
    const rawLimit = parseInt(searchParams.get("limit") ?? "100", 10);
    const offset = Number.isFinite(rawOffset) ? Math.max(0, rawOffset) : 0;
    const limit = Number.isFinite(rawLimit)
      ? Math.min(Math.max(1, rawLimit), 200)
      : 100;

    const thoughts = await sql(
      `
      SELECT id, content, created_at
      FROM tweets
      ORDER BY created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `
    );

    return NextResponse.json(thoughts);
  } catch (error) {
    console.error("Error fetching thoughts:", error);
    return NextResponse.json(
      { error: "Failed to fetch thoughts" },
      { status: 500 }
    );
  }
}
