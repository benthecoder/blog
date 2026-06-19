import type { PostFrontmatter, PostMetadata } from "@/types/post";

/**
 * Normalize a frontmatter `tags` value (array, comma-separated string, or
 * missing) into a clean string array. Shared by posts and wiki.
 */
export function parseTags(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value as string[];
  if (typeof value === "string") return value.split(",").map((t) => t.trim());
  return [];
}

export function extractTags(frontmatter: PostFrontmatter): string[] {
  return parseTags(frontmatter?.tags);
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
