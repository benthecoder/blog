import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import { visit } from "unist-util-visit";
import type { Root } from "mdast";
import { isBareUrlLabel, parsePublicUrl } from "@/utils/tweets/link";

const parser = unified().use(remarkParse).use(remarkGfm);

function mdastText(node: unknown): string {
  if (!node || typeof node !== "object") return "";
  if (
    "value" in node &&
    typeof (node as { value: unknown }).value === "string"
  ) {
    return (node as { value: string }).value;
  }
  if (
    "children" in node &&
    Array.isArray((node as { children: unknown }).children)
  ) {
    return (node as { children: unknown[] }).children.map(mdastText).join("");
  }
  return "";
}

export type MarkdownLink = { href: string; bare: boolean };

/** Public links in a thought, noting whether the visible text is just the URL. */
export function markdownLinks(content: string): MarkdownLink[] {
  const tree = parser.parse(content) as Root;
  const links: MarkdownLink[] = [];
  visit(tree, "link", (node) => {
    const href = parsePublicUrl(node.url);
    if (!href) return;
    links.push({
      href,
      bare: isBareUrlLabel(mdastText(node), node.url),
    });
  });
  return links;
}

export function contentHasUrl(content: string, url: string): boolean {
  const href = parsePublicUrl(url);
  if (!href) return false;
  return markdownLinks(content).some((link) => link.href === href);
}

export function bareContentUrls(content: string): string[] {
  const urls: string[] = [];
  const seen = new Set<string>();
  for (const link of markdownLinks(content)) {
    if (!link.bare || seen.has(link.href)) continue;
    seen.add(link.href);
    urls.push(link.href);
  }
  return urls;
}
