import { cache } from "react";
import { WIKI_DIR, getWikiPath } from "@/config/paths";
import type { WikiMetadata } from "@/types/wiki";
import { readMarkdownFile, scanMarkdownDir } from "./markdown";
import { parseTags } from "./tags";

export const getWikiContent = cache(function getWikiContent(slug: string) {
  return readMarkdownFile(getWikiPath(slug));
});

export interface WikiTreeNode {
  name: string;
  /** Pages filed directly at this node. */
  pages: WikiMetadata[];
  /** Sub-categories nested under this node. */
  children: WikiTreeNode[];
}

// Build a tree from slash-delimited `category` paths, e.g. "sciences/physics".
// A page with no category falls under "uncategorized". Children and pages are
// sorted alphabetically; "uncategorized" is pinned last at every level.
export const getWikiTree = cache(function getWikiTree(): WikiTreeNode[] {
  const root: WikiTreeNode = { name: "", pages: [], children: [] };

  const childNamed = (node: WikiTreeNode, name: string): WikiTreeNode => {
    let child = node.children.find((c) => c.name === name);
    if (!child) {
      child = { name, pages: [], children: [] };
      node.children.push(child);
    }
    return child;
  };

  for (const page of getWikiMetadata()) {
    const segments = page.category
      .split("/")
      .map((s) => s.trim())
      .filter(Boolean);
    let node = root;
    for (const segment of segments) node = childNamed(node, segment);
    node.pages.push(page);
  }

  const sortNode = (node: WikiTreeNode) => {
    node.pages.sort((a, b) => a.title.localeCompare(b.title));
    node.children.sort((a, b) => {
      if (a.name === "uncategorized") return 1;
      if (b.name === "uncategorized") return -1;
      return a.name.localeCompare(b.name);
    });
    node.children.forEach(sortNode);
  };
  sortNode(root);

  return root.children;
});

export const getWikiMetadata = cache(
  function getWikiMetadata(): WikiMetadata[] {
    return scanMarkdownDir(WIKI_DIR)
      .map(({ slug, data }) => ({
        title: (data.title as string) || slug,
        description: (data.description as string) || "",
        category: (data.category as string) || "uncategorized",
        tags: parseTags(data.tags),
        lastUpdated: (data.lastUpdated as string) || "",
        slug,
      }))
      .sort((a, b) => a.title.localeCompare(b.title));
  }
);
