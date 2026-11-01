import { cache } from "react";
import { WIKI_DIR, getWikiPath } from "@/config/paths";
import type { WikiMetadata } from "@/types/wiki";
import { readMarkdownFile, scanMarkdownDir } from "./markdown";
import { wikiFrontmatterSchema } from "./schemas";
import { parseTags } from "./tags";

export const getWikiContent = cache(function getWikiContent(slug: string) {
  return readMarkdownFile(getWikiPath(slug), wikiFrontmatterSchema);
});

export const getWikiMetadata = cache(
  function getWikiMetadata(): WikiMetadata[] {
    return scanMarkdownDir(WIKI_DIR, wikiFrontmatterSchema)
      .map(({ slug, data }) => ({
        title: data.title || slug,
        description: data.description || "",
        category: data.category || "uncategorized",
        tags: parseTags(data.tags),
        lastUpdated: data.lastUpdated || "",
        slug,
      }))
      .sort((a, b) => a.title.localeCompare(b.title));
  }
);
