import { getPostMetadata } from "@/utils/content/posts";
import { NextResponse } from "next/server";
import type { PostMetadata } from "@/types/post";

export const dynamic = "force-dynamic";

let cachedPosts: PostMetadata[] | null = null;

export function GET() {
  cachedPosts ??= getPostMetadata();
  const posts = cachedPosts;
  if (!posts.length) {
    return NextResponse.json({ error: "no posts" }, { status: 404 });
  }
  const random = posts[Math.floor(Math.random() * posts.length)];

  return NextResponse.json(
    { slug: random.slug },
    {
      headers: { "Cache-Control": "no-store" },
    }
  );
}
