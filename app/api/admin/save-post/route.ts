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

    const filePath = path.join(process.cwd(), "posts", `${slug}.md`);

    if (isNew && fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: "A post already exists for this date" },
        { status: 409 }
      );
    }

    const frontmatter = `---
title: '${title}'
tags: '${tags}'
date: '${date}'
---

${content}`;

    fs.writeFileSync(filePath, frontmatter, "utf8");

    return NextResponse.json({ success: true, slug });
  } catch (error) {
    console.error("Save error:", error);
    return NextResponse.json({ error: "Failed to save post" }, { status: 500 });
  }
}
