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

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function urlVariants(url: string): string[] {
  const parsed = parsePublicUrl(url);
  const base = parsed ?? url.trim();
  const stripped = base.replace(/\/$/, "");
  return uniqueStrings([base, stripped, stripped + "/"]);
}

/** True when this occurrence of the URL is a markdown destination, like `](url)`. */
function isMarkdownDestination(source: string, index: number): boolean {
  const open = source.lastIndexOf("](", index);
  if (open === -1) return false;
  const close = source.indexOf(")", open + 2);
  if (close === -1 || close < index) return false;
  return index >= open + 2;
}

/**
 * Drop bare occurrences of `url` from a thought, leaving labeled markdown
 * links like `[the paper](url)` in place.
 */
function removeBareUrl(content: string, url: string): string {
  let result = content;
  for (const variant of urlVariants(url)) {
    const escaped = escapeRegExp(variant);
    result = result.replace(new RegExp("<" + escaped + ">", "g"), "");
    result = result.replace(
      new RegExp(escaped, "g"),
      (match, offset: number) =>
        isMarkdownDestination(result, offset) ? match : ""
    );
  }
  return result
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** The link shown above the note: the stored `link`, else the first bare URL. */
export function featuredThoughtLink(
  content: string,
  link: string | null
): string | null {
  if (link) {
    const parsed = parsePublicUrl(link);
    if (parsed) return parsed;
  }
  return bareContentUrls(content)[0] ?? null;
}

export function notesWithoutFeaturedLink(
  content: string,
  featured: string | null
): string {
  const note = content.trim();
  if (!featured || !note) return note;
  return removeBareUrl(note, featured);
}
