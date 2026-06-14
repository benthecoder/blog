import { getPostMetadata } from "@/utils/content/posts";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  const posts = getPostMetadata();
  const random = posts[Math.floor(Math.random() * posts.length)];

  return new NextResponse(JSON.stringify({ slug: random.slug }), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}
