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
    const filePath = path.join(process.cwd(), "posts", `${slug}.md`);
    const fileContent = fs.readFileSync(filePath, "utf8");
    const { data, content } = matter(fileContent);

    return NextResponse.json({
      title: data.title || "",
      tags: data.tags || "",
      date: data.date || "",
      content,
    });
  } catch (error) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }
}
