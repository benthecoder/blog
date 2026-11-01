import type { PostFrontmatter, PostMetadata } from "@/types/post";
import type { z } from "zod";
import type { tagsSchema } from "./schemas";

const TOPIC_ALIASES: Record<string, string> = {
  ml: "machine-learning",
  coding: "programming",
  tech: "technology",
  movies: "film",
  job: "career",
  friends: "friendship",
  love: "relationships",
  recipe: "cooking",
  flight: "air-travel",
  roadtrip: "road-trips",
  mandarin: "chinese-language",
  sketching: "drawing",
  school: "education",
};

export function canonicalTopicTag(tag: string): string {
  const normalized = tag.trim().toLowerCase();
  return TOPIC_ALIASES[normalized] ?? normalized;
}

/**
 * Normalize a frontmatter `tags` value (array, comma-separated string, or
 * missing) into a clean string array. Shared by posts and wiki.
 */
export function parseTags(
  value: z.infer<typeof tagsSchema> | undefined
): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return value.split(",").map((t) => t.trim());
}

export function extractTags(
  frontmatter: Pick<PostFrontmatter, "tags">
): string[] {
  return parseTags(frontmatter.tags);
}

export function countTagFrequency(
  posts: PostMetadata[],
  exclude?: string[]
): [string, number][] {
  const counts: Record<string, number> = Object.create(null);
  const excluded = new Set(exclude ?? []);
  posts.forEach((post) =>
    post.tags.forEach((tag) => {
      if (tag && !excluded.has(tag)) counts[tag] = (counts[tag] ?? 0) + 1;
    })
  );
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}
