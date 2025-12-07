import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { slug } = await request.json();

    if (!slug) {
      return NextResponse.json({ error: "Slug required" }, { status: 400 });
    }

    const postsDir = path.join(process.cwd(), "posts");
    const draftsDir = path.join(process.cwd(), "posts", "drafts");
    const publishedPath = path.join(postsDir, `${slug}.md`);
    const draftPath = path.join(draftsDir, `${slug}.md`);

    // Check if already published
    if (fs.existsSync(publishedPath)) {
      return NextResponse.json(
        { error: "Post is already published" },
        { status: 400 }
      );
    }

    // Check if draft exists
    if (!fs.existsSync(draftPath)) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }

    // Move from drafts to posts
    fs.renameSync(draftPath, publishedPath);

    return NextResponse.json({ success: true, slug });
  } catch (error) {
    console.error("Publish error:", error);
    return NextResponse.json(
      { error: "Failed to publish post" },
      { status: 500 }
    );
  }
}
