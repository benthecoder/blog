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

    // Check if published post exists
    if (!fs.existsSync(publishedPath)) {
      return NextResponse.json(
        { error: "Published post not found" },
        { status: 404 }
      );
    }

    // Ensure drafts directory exists
    if (!fs.existsSync(draftsDir)) {
      fs.mkdirSync(draftsDir, { recursive: true });
    }

    // Move from posts to drafts
    fs.renameSync(publishedPath, draftPath);

    return NextResponse.json({ success: true, slug });
  } catch (error) {
    console.error("Unpublish error:", error);
    return NextResponse.json(
      { error: "Failed to unpublish post" },
      { status: 500 }
    );
  }
}
