import { cache } from "react";
import { ESSAYS_DIR, ESSAY_DRAFTS_DIR, getEssayPath } from "@/config/paths";
import { readMarkdownFile, scanMarkdownDir } from "./markdown";
import { essayFrontmatterSchema } from "./schemas";
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

function countWords(content: string): number {
  return (content.match(/\b\w+\b/gu) || []).length;
}

export const getEssayMetadata = cache(
  function getEssayMetadata(): EssayMetadata[] {
    return scanMarkdownDir(ESSAYS_DIR, essayFrontmatterSchema)
      .map(({ slug, data, content }) => {
        const wordcount = countWords(content);
        return {
          slug,
          title: data.title || slug,
          subtitle: data.subtitle || "",
          date: data.date,
          updated: data.updated || null,
          tags: parseTags(data.tags),
          wordcount,
          readingTime: Math.max(1, Math.round(wordcount / 200)),
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
);

export const getEssayContent = cache(function getEssayContent(slug: string) {
  return readMarkdownFile(getEssayPath(slug), essayFrontmatterSchema);
});

export interface EssayAdminEntry {
  slug: string;
  title: string;
  subtitle: string;
  date: string;
  isDraft: boolean;
}

// Admin only: drafts live outside the public loader's folder and never ship.
export function getEssayAdminList(): EssayAdminEntry[] {
  const read = (dir: string, isDraft: boolean) =>
    scanMarkdownDir(dir, essayFrontmatterSchema).map(({ slug, data }) => ({
      slug,
      title: data.title || slug,
      subtitle: data.subtitle || "",
      date: data.date,
      isDraft,
    }));
  return [...read(ESSAY_DRAFTS_DIR, true), ...read(ESSAYS_DIR, false)].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}
