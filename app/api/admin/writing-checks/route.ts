import { NextRequest, NextResponse } from "next/server";
import { getLinkIndex } from "@/utils/content/links";
import { checkWriting } from "@/utils/content/writingChecks";
import { isWikiEditorSlug } from "@/utils/content/wikiAdmin";

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production")
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (request.headers.get("origin") !== request.nextUrl.origin)
    return NextResponse.json(
      { error: "Same-origin requests required" },
      { status: 403 }
    );
  if (
    !request.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  )
    return NextResponse.json({ error: "JSON required" }, { status: 415 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body))
    return NextResponse.json(
      { error: "Invalid writing check" },
      { status: 400 }
    );
  const { content, title, slug } = body as Record<string, unknown>;
  if (
    typeof content !== "string" ||
    content.length > 2_000_000 ||
    typeof title !== "string" ||
    title.length > 200 ||
    typeof slug !== "string" ||
    slug.length > 120
  )
    return NextResponse.json(
      { error: "Invalid writing check" },
      { status: 400 }
    );
  try {
    const { entries } = getLinkIndex();
    const currentEntries =
      title.trim() && isWikiEditorSlug(slug)
        ? [
            {
              ref: { kind: "wiki" as const, slug },
              title: title.trim(),
              href: `/wiki/${slug}`,
            },
            ...entries.filter(
              (entry) => entry.ref.kind !== "wiki" || entry.ref.slug !== slug
            ),
          ]
        : entries;
    const checks = checkWriting(content, currentEntries);
    return NextResponse.json({
      checks: checks.slice(0, 50),
      total: checks.length,
    });
  } catch (error) {
    console.error("Writing check failed", error);
    return NextResponse.json(
      { error: "Could not check writing" },
      { status: 500 }
    );
  }
}
