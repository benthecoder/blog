import { NextResponse } from "next/server";
import { getRecentlyPlayed } from "@/utils/spotify";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const response = await getRecentlyPlayed(5);
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching recently played:", error);
    return NextResponse.json({ tracks: [] }, { status: 200 });
  }
}
