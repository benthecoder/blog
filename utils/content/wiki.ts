import { cache } from "react";
import { WIKI_DIR, getWikiPath } from "@/config/paths";
import type { WikiMetadata } from "@/types/wiki";
import { readMarkdownFile, scanMarkdownDir } from "./markdown";
import { parseTags } from "./tags";

export const getWikiContent = cache(function getWikiContent(slug: string) {
  return readMarkdownFile(getWikiPath(slug));
});

export interface WikiCategory {
  name: string;
  pages: WikiMetadata[];
}

// Pages grouped under their parent category for the index. Categories are
// alphabetical with "Uncategorized" pinned last; pages within a category are
// most-recently-updated first (undated pages fall to the bottom).
export const getWikiByCategory = cache(
  function getWikiByCategory(): WikiCategory[] {
    const groups = new Map<string, WikiMetadata[]>();
    for (const page of getWikiMetadata()) {
      const bucket = groups.get(page.category) ?? [];
      bucket.push(page);
      groups.set(page.category, bucket);
    }

    return [...groups.entries()]
      .map(([name, pages]) => ({
        name,
        pages: pages.sort((a, b) => a.title.localeCompare(b.title)),
      }))
      .sort((a, b) => {
        if (a.name === "Uncategorized") return 1;
        if (b.name === "Uncategorized") return -1;
        return a.name.localeCompare(b.name);
      });
  }
);

export const getWikiMetadata = cache(
  function getWikiMetadata(): WikiMetadata[] {
    return scanMarkdownDir(WIKI_DIR)
      .map(({ slug, data }) => ({
        title: (data.title as string) || slug,
        description: (data.description as string) || "",
        category: (data.category as string) || "Uncategorized",
        tags: parseTags(data.tags),
        lastUpdated: (data.lastUpdated as string) || "",
        slug,
      }))
      .sort((a, b) => a.title.localeCompare(b.title));
  }
);
