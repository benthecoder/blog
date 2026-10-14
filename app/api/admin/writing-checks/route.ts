import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getLinkIndex } from "@/utils/content/links";
import { checkWriting } from "@/utils/content/writingChecks";
import { isWikiEditorSlug } from "@/utils/content/wikiAdmin";

const checkSchema = z.object({
  content: z.string().max(2_000_000),
  title: z.string().max(200),
  slug: z.string().max(120),
});

export async function POST(request: NextRequest) {
  // Local authoring tool, like wiki saves: production never reads the index here.
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
  const parsed = checkSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: "Invalid writing check" },
      { status: 400 }
    );
  const { content, title, slug } = parsed.data;
  try {
    const { entries } = getLinkIndex();
    // Check against the page as it is being edited: its unsaved title counts.
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
