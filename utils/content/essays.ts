import { cache } from "react";
import { ESSAYS_DIR, getEssayPath } from "@/config/paths";
import { readMarkdownFile, scanMarkdownDir } from "./markdown";
import { parseTags } from "./tags";

export interface EssayMetadata {
  slug: string;
  title: string;
  subtitle: string;
  date: string;
  updated: string | null;
  tags: string[];
  wordcount: number;
  readingTime: number;
}

// Files starting with "_" are local drafts: visible in dev, never shipped.
const isListed = (slug: string) =>
  !slug.startsWith("_") || process.env.NODE_ENV !== "production";

// Frontmatter dates may parse as Date objects; keep them as YYYY-MM-DD.
function toDateString(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return typeof value === "string" ? value : "";
}

export function countWords(content: string): number {
  return (content.match(/\b\w+\b/gu) || []).length;
}

export const getEssayMetadata = cache(
  function getEssayMetadata(): EssayMetadata[] {
    return scanMarkdownDir(ESSAYS_DIR)
      .filter(({ slug }) => isListed(slug))
      .map(({ slug, data, content }) => {
        const wordcount = countWords(content);
        const updated = toDateString(data.updated);
        return {
          slug,
          title: (data.title as string) || slug,
          subtitle: (data.subtitle as string) || "",
          date: toDateString(data.date),
          updated: updated || null,
          tags: parseTags(data.tags),
          wordcount,
          readingTime: Math.max(1, Math.round(wordcount / 200)),
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
);

export const getEssayContent = cache(function getEssayContent(slug: string) {
  if (!isListed(slug)) throw new Error("Essay not found");
  return readMarkdownFile(getEssayPath(slug));
});
