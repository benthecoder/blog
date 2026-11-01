import fs from "fs";
import { readMarkdownFile } from "@/utils/content/markdown";
import { FrontmatterError } from "@/utils/content/frontmatter";
import { NextRequest, NextResponse } from "next/server";
import {
  essayFrontmatterSchema,
  postFrontmatterSchema,
} from "@/utils/content/schemas";
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

    // Continue unpublished edits when a draft and published post share a date.
    let filePath: string;
    let isDraft = false;

    if (fs.existsSync(draftPath)) {
      filePath = draftPath;
      isDraft = true;
    } else if (fs.existsSync(publishedPath)) {
      filePath = publishedPath;
    } else {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (kind === "essay") {
      const { data, content } = readMarkdownFile(
        filePath,
        essayFrontmatterSchema
      );
      return NextResponse.json({
        subtitle: data.subtitle ?? "",
        updated: data.updated ?? "",
        format: data.format,
        title: data.title,
        tags: data.tags ?? "",
        date: data.date,
        content,
        isDraft,
      });
    }
    const { data, content } = readMarkdownFile(filePath, postFrontmatterSchema);
    return NextResponse.json({
      format: data.format,
      title: data.title,
      tags: data.tags ?? "",
      date: data.date,
      content,
      isDraft,
    });
  } catch (error) {
    if (error instanceof FrontmatterError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }
}
