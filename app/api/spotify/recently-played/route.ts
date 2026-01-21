import { NextResponse } from "next/server";
import { getRecentlyPlayed } from "@/utils/spotify";

// Revalidate every 60 seconds - recently played doesn't change as frequently
export const revalidate = 60;

export async function GET() {
  try {
    const response = await getRecentlyPlayed(5);
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching recently played:", error);
    return NextResponse.json({ tracks: [] }, { status: 200 });
  }
}
