import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { upstashRequest, upstashPipeline } from "@/utils/upstash";
import { COUNT_VIEW_SCRIPT } from "@/utils/viewCounter";
import { isSafeSlug } from "@/config/paths";
import { getPostSlugs } from "@/utils/content/posts";

export const dynamic = "force-dynamic";
const VIEW_TTL_SECONDS = 24 * 60 * 60;
const READ_BATCH_SIZE = 200;

// Keep short-lived viewer deduplication separate from persistent counters.
const viewKey = (slug: string) => `views:${slug}`;
const dedupeKey = (slug: string, viewer: string) =>
  `viewdedupe:${slug}:${viewer}`;

const parseSlug = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length <= 255 && isSafeSlug(trimmed) ? trimmed : null;
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
  if (searchParams.has("slug") && !slug) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }
  const publishedSlugs = getPostSlugs();
  if (slug && !publishedSlugs.includes(slug)) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  if (!slug) {
    try {
      // Published filenames bound the read; no Redis keyspace scan is needed.
      const batches: string[][] = [];
      for (
        let offset = 0;
        offset < publishedSlugs.length;
        offset += READ_BATCH_SIZE
      ) {
        batches.push(publishedSlugs.slice(offset, offset + READ_BATCH_SIZE));
      }
      const counts = await upstashPipeline(
        batches.map((batch) => ["MGET", ...batch.map(viewKey)])
      );
      const results = batches.flatMap((batch, batchIndex) => {
        const values = counts[batchIndex] as Array<string | null>;
        return batch.map((postSlug, i) => ({
          slug: postSlug,
          count: Number(values[i] ?? 0),
        }));
      });
      results.sort((a, b) => b.count - a.count);

      // Popularity sorting does not need real-time updates.
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

  const slug = parseSlug(
    body && typeof body === "object" && !Array.isArray(body)
      ? (body as { slug?: unknown }).slug
      : undefined
  );

  if (!slug) {
    return NextResponse.json({ error: "Slug required" }, { status: 400 });
  }
  if (!getPostSlugs().includes(slug)) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  try {
    const viewerHash = getViewerHash(request);
    const key = viewKey(slug);

    const count = Number(
      await upstashRequest([
        "EVAL",
        COUNT_VIEW_SCRIPT,
        2,
        key,
        dedupeKey(slug, viewerHash),
        VIEW_TTL_SECONDS,
      ])
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
