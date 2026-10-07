import fs from "fs";
import { writeMarkdownFile } from "@/utils/content/markdown";
import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/utils/adminAuth";
import { getPostPath, getDraftPath, isSafeSlug } from "@/config/paths";

export async function POST(request: NextRequest) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;
  try {
    const { slug, title, tags, date, content, isNew } = await request.json();

    if (!slug || !title) {
      return NextResponse.json(
        { error: "Slug and title required" },
        { status: 400 }
      );
    }

    // Security: prevent path traversal
    if (!isSafeSlug(slug)) {
      return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
    }

    const publishedPath = getPostPath(slug);
    const draftPath = getDraftPath(slug);

    // Check if post already exists (in either location) when creating new
    if (isNew) {
      if (fs.existsSync(publishedPath)) {
        return NextResponse.json(
          { error: "A post already exists for this date" },
          { status: 409 }
        );
      }
      if (fs.existsSync(draftPath)) {
        return NextResponse.json(
          { error: "A draft already exists for this date" },
          { status: 409 }
        );
      }
    }

    // Determine where to save: if already published, keep it published; otherwise save as draft
    const isPublished = fs.existsSync(publishedPath);
    const filePath = isPublished ? publishedPath : draftPath;

    writeMarkdownFile(filePath, { title, tags, date }, content, {
      exclusive: Boolean(isNew),
    });

    return NextResponse.json({ success: true, slug, isDraft: !isPublished });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") {
      return NextResponse.json(
        { error: "A post or draft already exists for this date" },
        { status: 409 }
      );
    }
    console.error("Save error:", error);
    return NextResponse.json({ error: "Failed to save post" }, { status: 500 });
  }
}
