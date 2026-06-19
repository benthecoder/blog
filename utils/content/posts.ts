import { cache } from "react";
import fs from "fs";
import path from "path";
import { POSTS_DIR, getPostPath } from "@/config/paths";
import type { PostFrontmatter, PostMetadata } from "@/types/post";
import { readMarkdownFile, scanMarkdownDir } from "./markdown";

export function extractTags(frontmatter: PostFrontmatter): string[] {
  const tagValue = frontmatter?.tags;
  if (!tagValue) return [];
  if (Array.isArray(tagValue)) return tagValue;
  if (typeof tagValue === "string")
    return tagValue.split(",").map((t) => t.trim());
  return [];
}

function calculateWordCount(content: string): number {
  const withoutBlockquotes = content
    .split("\n")
    .filter((line) => !line.trim().startsWith(">"))
    .join("\n");
  return (withoutBlockquotes.match(/\b\w+\b/gu) || []).length;
}

export function getAllPosts(includeDrafts = false): string[] {
  function getMarkdownFiles(dir: string): string[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    return entries.reduce<string[]>((files, entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) return [...files, ...getMarkdownFiles(fullPath)];
      if (entry.name.endsWith(".md")) return [...files, fullPath];
      return files;
    }, []);
  }
  const all = getMarkdownFiles(POSTS_DIR);
  return includeDrafts
    ? all
    : all.filter((f) => !f.includes("/drafts/") && !f.includes("\\drafts\\"));
}

export const getPostContent = cache(function getPostContent(slug: string) {
  return readMarkdownFile(getPostPath(slug));
});

export function countTagFrequency(
  posts: PostMetadata[],
  exclude?: string[]
): [string, number][] {
  const counts: Record<string, number> = {};
  const excluded = new Set(exclude ?? []);
  posts.forEach((post) =>
    post.tags.forEach((tag) => {
      if (tag && !excluded.has(tag)) counts[tag] = (counts[tag] ?? 0) + 1;
    })
  );
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

export function getPostMetadata(
  options: { includeDrafts?: boolean } = {}
): PostMetadata[] {
  const { includeDrafts = false } = options;
  const dirs = includeDrafts
    ? [POSTS_DIR, path.join(POSTS_DIR, "drafts")]
    : [POSTS_DIR];

  const posts: PostMetadata[] = dirs.flatMap((dir) =>
    scanMarkdownDir(dir).map(({ slug, data, content }) => ({
      title: data.title as string,
      date: data.date as string,
      tags: extractTags(data as PostFrontmatter),
      wordcount: calculateWordCount(content),
      slug,
      isDraft: dir.includes("drafts"),
      prev: null,
      next: null,
    }))
  );

  posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  posts.forEach((post, i) => {
    post.prev = i < posts.length - 1 ? posts[i + 1] : null;
    post.next = i > 0 ? posts[i - 1] : null;
  });
  return posts;
}
