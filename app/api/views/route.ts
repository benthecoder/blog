import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { upstashRequest } from "@/utils/upstash";

export const dynamic = "force-dynamic";
const VIEW_TTL_SECONDS = 24 * 60 * 60;

// Dedupe keys deliberately sit outside the `views:` namespace. They outnumber
// the counters by orders of magnitude (one per viewer per post per day), so
// sharing a prefix would make the archive's SCAN walk all of them.
const viewKey = (slug: string) => `views:${slug}`;
const dedupeKey = (slug: string, viewer: string) =>
  `viewdedupe:${slug}:${viewer}`;

const parseSlug = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const getViewerHash = (request: NextRequest) => {
  const forwardedFor = request.headers.get("x-forwarded-for") || "";
  const ip =
    forwardedFor.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";
  const acceptLanguage = request.headers.get("accept-language") || "";

  return createHash("sha256")
    .update(`${ip}|${userAgent}|${acceptLanguage}`)
    .digest("hex");
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = parseSlug(searchParams.get("slug"));

  if (!slug) {
    try {
      let cursor = "0";
      const keys: string[] = [];
      do {
        const result = (await upstashRequest([
          "SCAN",
          cursor,
          "MATCH",
          "views:*",
          "COUNT",
          200,
        ])) as [string, string[]];
        cursor = result[0];
        keys.push(...result[1]);
      } while (cursor !== "0");

      if (keys.length === 0) return NextResponse.json({ results: [] });

      const counts = (await upstashRequest(["MGET", ...keys])) as Array<
        string | null
      >;
      const results = keys
        .map((key, i) => ({
          slug: key.slice("views:".length),
          count: Number(counts[i] ?? 0),
        }))
        .sort((a, b) => b.count - a.count);

      // A whole-keyspace SCAN behind a leaderboard nobody reads in real time.
      // An hour of edge cache turns this from per-visitor into per-hour.
      return NextResponse.json(
        { results },
        {
          headers: {
            "Cache-Control":
              "public, s-maxage=3600, stale-while-revalidate=86400",
          },
        }
      );
    } catch (error) {
      console.error("Error fetching all views:", error);
      return NextResponse.json(
        { error: "Failed to fetch views" },
        { status: 500 }
      );
    }
  }

  try {
    const result = await upstashRequest(["GET", viewKey(slug)]);
    const count = Number(result ?? 0);

    return NextResponse.json(
      { slug, count },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=3600",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching post views:", error);
    return NextResponse.json(
      { error: "Failed to fetch post views" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const slug = parseSlug((body as { slug?: unknown }).slug);

  if (!slug) {
    return NextResponse.json({ error: "Slug required" }, { status: 400 });
  }

  try {
    const viewerHash = getViewerHash(request);
    const key = viewKey(slug);

    const setResult = await upstashRequest([
      "SET",
      dedupeKey(slug, viewerHash),
      "1",
      "EX",
      VIEW_TTL_SECONDS,
      "NX",
    ]);

    const count = Number(
      (await upstashRequest([setResult === "OK" ? "INCR" : "GET", key])) ?? 0
    );

    return NextResponse.json({ slug, count });
  } catch (error) {
    console.error("Error incrementing post views:", error);
    return NextResponse.json(
      { error: "Failed to update post views" },
      { status: 500 }
    );
  }
}
