import { NextResponse } from "next/server";
import { getEssayMetadata } from "@/utils/content/essays";
import { getPostMetadata } from "@/utils/content/posts";
import { getWikiMetadata } from "@/utils/content/wiki";

// Static index of known paths; the 404 page fetches it to suggest where a
// mistyped or stale link probably meant to go.
export const dynamic = "force-static";

const PAGES = [
  "about",
  "colophon",
  "contact",
  "curius",
  "essays",
  "flashcards",
  "hn",
  "library",
  "map",
  "now",
  "papers",
  "photos",
  "posts",
  "projects",
  "random",
  "recipes",
  "search",
  "sketch",
  "start",
  "tags",
  "thoughts",
  "tweet",
  "uses",
  "wave",
  "wiki",
];

export function GET() {
  return NextResponse.json([
    ...PAGES.map((p) => ({ path: `/${p}`, title: p })),
    ...getPostMetadata().map((p) => ({
      path: `/posts/${p.slug}`,
      title: p.title || p.slug,
    })),
    ...getWikiMetadata().map((w) => ({
      path: `/wiki/${w.slug}`,
      title: w.title,
    })),
    ...getEssayMetadata().map((e) => ({
      path: `/essays/${e.slug}`,
      title: e.title,
    })),
  ]);
}
