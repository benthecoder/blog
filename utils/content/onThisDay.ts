import type { PostMetadata } from "@/types/post";
import { getPostMetadata } from "./posts";

export interface SameDayPost {
  slug: string;
  title: string;
  year: number;
}

interface SameDayIndex {
  byDay: Map<string, SameDayPost[]>;
  dayBySlug: Map<string, string>;
}

// Local getters throughout: frontmatter dates carry no timezone, and the rest
// of the site parses them with `new Date(date)` too.
export function buildSameDayIndex(
  posts: Pick<PostMetadata, "slug" | "title" | "date">[]
): SameDayIndex {
  const byDay = new Map<string, SameDayPost[]>();
  const dayBySlug = new Map<string, string>();

  for (const { slug, title, date } of posts) {
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) continue;

    const day = `${d.getMonth() + 1}-${d.getDate()}`;
    const group = byDay.get(day) ?? [];
    group.push({ slug, title, year: d.getFullYear() });
    byDay.set(day, group);
    dayBySlug.set(slug, day);
  }

  for (const group of byDay.values()) group.sort((a, b) => a.year - b.year);
  return { byDay, dayBySlug };
}

let index: SameDayIndex | null = null;

export function getSameDayPosts(slug: string): SameDayPost[] {
  index ??= buildSameDayIndex(getPostMetadata());
  const day = index.dayBySlug.get(slug);
  if (!day) return [];
  return (index.byDay.get(day) ?? []).filter((post) => post.slug !== slug);
}
