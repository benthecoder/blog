import { NextResponse } from "next/server";
import { getPostMetadata, getPostContent } from "@/utils/content/posts";
import { buildRssFeed } from "@/utils/content/rss";

export const dynamic = "force-static";

export function GET() {
  try {
    const rss = buildRssFeed(
      getPostMetadata(),
      (slug) => getPostContent(slug).content
    );
    return new NextResponse(rss, {
      headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
    });
  } catch {
    return new NextResponse(null, {
      status: 500,
      statusText: "Internal Server Error",
      headers: { "Content-Type": "text/plain" },
    });
  }
}
