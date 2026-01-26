import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { upstashRequest } from "@/utils/upstash";

export const dynamic = "force-dynamic";
const VIEW_TTL_SECONDS = 24 * 60 * 60;

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
    return NextResponse.json({ error: "Slug required" }, { status: 400 });
  }

  try {
    const viewKey = `views:${slug}`;
    const result = await upstashRequest(["GET", viewKey]);
    const count = Number(result ?? 0);

    return NextResponse.json({ slug, count });
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
    const viewKey = `views:${slug}`;
    const dedupeKey = `views:dedupe:${slug}:${viewerHash}`;

    const setResult = await upstashRequest([
      "SET",
      dedupeKey,
      "1",
      "EX",
      VIEW_TTL_SECONDS,
      "NX",
    ]);

    let count: number;

    if (setResult === "OK") {
      const incremented = await upstashRequest(["INCR", viewKey]);
      count = Number(incremented ?? 0);
    } else {
      const existing = await upstashRequest(["GET", viewKey]);
      count = Number(existing ?? 0);
    }

    return NextResponse.json({ slug, count });
  } catch (error) {
    console.error("Error incrementing post views:", error);
    return NextResponse.json(
      { error: "Failed to update post views" },
      { status: 500 }
    );
  }
}
