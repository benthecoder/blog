import fs from "fs";
import matter from "gray-matter";
import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/utils/adminAuth";
import { getPostPath, getDraftPath, isSafeSlug } from "@/config/paths";

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

  const authError = checkAdminAuth(request);
  if (authError) return authError;
  try {
    const publishedPath = getPostPath(slug);
    const draftPath = getDraftPath(slug);

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

    const fileContent = fs.readFileSync(filePath, "utf8");
    const { data, content } = matter(fileContent);

    return NextResponse.json({
      title: data.title || "",
      tags: data.tags || "",
      date: data.date || "",
      content,
      isDraft,
    });
  } catch {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }
}
