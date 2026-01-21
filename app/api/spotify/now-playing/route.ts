import { NextResponse } from "next/server";
import { getNowPlaying } from "@/utils/spotify";

// Revalidate every 30 seconds to reduce origin requests while keeping data fresh
export const revalidate = 30;

export async function GET() {
  try {
    const response = await getNowPlaying();
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching now playing:", error);
    return NextResponse.json({ isPlaying: false }, { status: 200 });
  }
}
