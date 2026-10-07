import { NextResponse } from "next/server";
import {
  getRecentlyPlayed,
  getRecentlyPlayedCacheSeconds,
} from "@/utils/spotify";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const response = await getRecentlyPlayed(10);
    return NextResponse.json(response, {
      headers: {
        "Cache-Control": `public, max-age=0, s-maxage=${getRecentlyPlayedCacheSeconds(10)}, stale-while-revalidate=60`,
      },
    });
  } catch {
    return NextResponse.json(
      { tracks: [] },
      {
        status: 502,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }
}
