import { cache } from "react";
import { WIKI_DIR, getWikiPath } from "@/config/paths";
import type { WikiMetadata } from "@/types/wiki";
import { readMarkdownFile, scanMarkdownDir } from "./markdown";
import { parseTags } from "./tags";

export const getWikiContent = cache(function getWikiContent(slug: string) {
  return readMarkdownFile(getWikiPath(slug));
});

export const getWikiMetadata = cache(
  function getWikiMetadata(): WikiMetadata[] {
    return scanMarkdownDir(WIKI_DIR)
      .map(({ slug, data }) => ({
        title: (data.title as string) || slug,
        description: (data.description as string) || "",
        tags: parseTags(data.tags),
        lastUpdated: (data.lastUpdated as string) || "",
        slug,
      }))
      .sort((a, b) => a.title.localeCompare(b.title));
  }
);
