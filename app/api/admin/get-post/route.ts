import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  if (!slug) {
    return NextResponse.json({ error: "Slug required" }, { status: 400 });
  }

  try {
    const postsDir = path.join(process.cwd(), "posts");
    const draftsDir = path.join(process.cwd(), "posts", "drafts");
    const publishedPath = path.join(postsDir, `${slug}.md`);
    const draftPath = path.join(draftsDir, `${slug}.md`);

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
  } catch (error) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }
}
