import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { saveWikiEditorPage, WikiEditError } from "@/utils/content/wikiAdmin";

export async function POST(request: NextRequest) {
  // File-based authoring runs locally; production has no persistent writable checkout.
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
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  try {
    const page = saveWikiEditorPage(input);
    revalidatePath("/admin/wiki");
    revalidatePath("/wiki");
    revalidatePath("/wiki/[slug]", "page");
    // Posts also resolve wiki links and display backlinks from wiki pages.
    revalidatePath("/posts/[slug]", "page");
    return NextResponse.json({ page });
  } catch (error) {
    if (error instanceof WikiEditError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    console.error("Wiki save failed", error);
    return NextResponse.json(
      { error: "Could not save wiki page" },
      { status: 500 }
    );
  }
}
