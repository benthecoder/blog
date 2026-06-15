import { getPostMetadata } from "@/utils/content/posts";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  const posts = getPostMetadata();
  const random = posts[Math.floor(Math.random() * posts.length)];

  return NextResponse.json(
    { slug: random.slug },
    {
      headers: { "Cache-Control": "no-store" },
    }
  );
}
