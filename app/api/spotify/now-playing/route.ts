import { NextResponse } from "next/server";
import { getNowPlaying } from "@/utils/spotify";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const response = await getNowPlaying();
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching now playing:", error);
    return NextResponse.json({ isPlaying: false }, { status: 200 });
  }
}
