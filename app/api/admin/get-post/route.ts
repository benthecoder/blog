import fs from "fs";
import { readMarkdownFile } from "@/utils/content/markdown";
import { NextRequest, NextResponse } from "next/server";
import { toDateString } from "@/utils/content/essayDate";
import { checkAdminAuth } from "@/utils/adminAuth";
import { isSafeSlug } from "@/config/paths";
import { parseKind, contentPaths } from "@/utils/content/kind";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  if (!slug) {
    return NextResponse.json({ error: "Slug required" }, { status: 400 });
  }

  // Security: prevent path traversal
  if (!isSafeSlug(slug)) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  const kind = parseKind(searchParams.get("kind"));
  if (!kind) {
    return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
  }

  const authError = checkAdminAuth(request);
  if (authError) return authError;
  try {
    const { publishedPath: getPublished, draftPath: getDraft } =
      contentPaths(kind);
    const publishedPath = getPublished(slug);
    const draftPath = getDraft(slug);

    // Check published first, then drafts
    let filePath: string;
    let isDraft = false;

    if (fs.existsSync(publishedPath)) {
      filePath = publishedPath;
    } else if (fs.existsSync(draftPath)) {
      filePath = draftPath;
      isDraft = true;
    } else {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const { data, content } = readMarkdownFile(filePath);

    return NextResponse.json({
      ...(kind === "essay"
        ? {
            subtitle: data.subtitle || "",
            updated: data.updated ? toDateString(data.updated) : "",
          }
        : {}),
      title: data.title || "",
      tags: data.tags || "",
      date: kind === "essay" ? toDateString(data.date) : data.date || "",
      content,
      isDraft,
    });
  } catch {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }
}
