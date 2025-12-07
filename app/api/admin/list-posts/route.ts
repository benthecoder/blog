import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const postsDir = path.join(process.cwd(), "posts");
    const draftsDir = path.join(process.cwd(), "posts", "drafts");

    const publishedFiles = fs.existsSync(postsDir)
      ? fs.readdirSync(postsDir).filter((file) => file.endsWith(".md"))
      : [];

    const draftFiles = fs.existsSync(draftsDir)
      ? fs.readdirSync(draftsDir).filter((file) => file.endsWith(".md"))
      : [];

    // Combine and remove .md extension
    const allSlugs = [
      ...publishedFiles.map((f) => f.replace(".md", "")),
      ...draftFiles.map((f) => f.replace(".md", "")),
    ];

    // Remove duplicates
    const uniqueSlugs = Array.from(new Set(allSlugs));

    return NextResponse.json(uniqueSlugs);
  } catch (error) {
    console.error("List posts error:", error);
    return NextResponse.json(
      { error: "Failed to list posts" },
      { status: 500 }
    );
  }
}
