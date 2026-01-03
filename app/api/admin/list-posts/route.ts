import fs from "fs";
import path from "path";
import matter from "gray-matter";
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

    const getPostDate = (filePath: string) => {
      try {
        const content = fs.readFileSync(filePath, "utf-8");
        const { data } = matter(content);
        return data.date ? new Date(data.date).getTime() : 0;
      } catch {
        return 0;
      }
    };

    const allPosts = [
      ...publishedFiles.map((f) => ({
        slug: f.replace(".md", ""),
        timestamp: getPostDate(path.join(postsDir, f)),
      })),
      ...draftFiles.map((f) => ({
        slug: f.replace(".md", ""),
        timestamp: getPostDate(path.join(draftsDir, f)),
      })),
    ];

    // Remove duplicates (keep the one with valid timestamp)
    const uniquePosts = Array.from(
      allPosts
        .reduce((map, post) => {
          const existing = map.get(post.slug);
          if (!existing || post.timestamp > existing.timestamp) {
            map.set(post.slug, post);
          }
          return map;
        }, new Map())
        .values()
    );

    // Sort by timestamp
    const sorted = uniquePosts
      .filter((p) => p.timestamp > 0)
      .sort((a, b) => a.timestamp - b.timestamp)
      .map((p) => p.slug);

    return NextResponse.json(sorted);
  } catch (error) {
    console.error("List posts error:", error);
    return NextResponse.json(
      { error: "Failed to list posts" },
      { status: 500 }
    );
  }
}
