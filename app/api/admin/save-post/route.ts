import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { slug, title, tags, date, content, isNew } = await request.json();

    if (!slug || !title) {
      return NextResponse.json(
        { error: "Slug and title required" },
        { status: 400 }
      );
    }

    const postsDir = path.join(process.cwd(), "posts");
    const draftsDir = path.join(process.cwd(), "posts", "drafts");
    const publishedPath = path.join(postsDir, `${slug}.md`);
    const draftPath = path.join(draftsDir, `${slug}.md`);

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

    // Ensure drafts directory exists
    if (!isPublished && !fs.existsSync(draftsDir)) {
      fs.mkdirSync(draftsDir, { recursive: true });
    }

    const frontmatter = `---
title: '${title}'
tags: '${tags}'
date: '${date}'
---

${content}`;

    fs.writeFileSync(filePath, frontmatter, "utf8");

    return NextResponse.json({ success: true, slug, isDraft: !isPublished });
  } catch (error) {
    console.error("Save error:", error);
    return NextResponse.json({ error: "Failed to save post" }, { status: 500 });
  }
}
