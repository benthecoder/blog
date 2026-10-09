import { NextResponse } from "next/server";
import { getEssayContent, getEssayMetadata } from "@/utils/content/essays";
import { buildRssFeed } from "@/utils/content/rss";

export const dynamic = "force-static";

export function GET() {
  try {
    const rss = buildRssFeed(
      getEssayMetadata(),
      (slug) => getEssayContent(slug).content,
      {
        title: "Benedict Neo — essays",
        description: "Long-form essays",
        basePath: "/essays/",
        selfPath: "/essays/rss.xml",
      }
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
