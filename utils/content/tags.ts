import type { PostFrontmatter, PostMetadata } from "@/types/post";

export function extractTags(frontmatter: PostFrontmatter): string[] {
  const tagValue = frontmatter?.tags;
  if (!tagValue) return [];
  if (Array.isArray(tagValue)) return tagValue;
  if (typeof tagValue === "string")
    return tagValue.split(",").map((t) => t.trim());
  return [];
}

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
