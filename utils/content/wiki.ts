import { WIKI_DIR, getWikiPath } from "@/config/paths";
import type { WikiMetadata } from "@/types/wiki";
import { readMarkdownFile, scanMarkdownDir } from "./markdown";

export function getWikiContent(slug: string) {
  return readMarkdownFile(getWikiPath(slug));
}

export function getWikiMetadata(): WikiMetadata[] {
  return scanMarkdownDir(WIKI_DIR)
    .map(({ slug, data }) => ({
      title: (data.title as string) || slug,
      description: (data.description as string) || "",
      tags: Array.isArray(data.tags)
        ? (data.tags as string[])
        : typeof data.tags === "string"
          ? (data.tags as string).split(",").map((t) => t.trim())
          : [],
      lastUpdated: (data.lastUpdated as string) || "",
      slug,
    }))
    .sort((a, b) => a.title.localeCompare(b.title));
}
