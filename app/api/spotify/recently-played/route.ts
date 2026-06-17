import { NextResponse } from "next/server";
import { getRecentlyPlayed } from "@/utils/spotify";

export const revalidate = 300;

export async function GET() {
  try {
    const response = await getRecentlyPlayed(10);
    return NextResponse.json(response);
  } catch {
    return NextResponse.json({ tracks: [] });
  }
}
