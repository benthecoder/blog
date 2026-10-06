import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import { slug } from "github-slugger";
import type { Node } from "unist";
import type { LinkableEntry } from "@/types/links";
import { parseWikiLinks, splitOnWikiLinks } from "@/utils/links/parse";
import { createResolver } from "@/utils/links/resolve";

type CheckNode = Node & {
  children?: CheckNode[];
  value?: string;
  url?: string;
  identifier?: string;
};
export interface WritingCheck {
  kind: "missing-wiki" | "missing-page" | "repeated-heading";
  line: number;
  label: string;
  target?: string;
}

const parser = unified().use(remarkParse).use(remarkGfm);
function textOf(node: CheckNode): string {
  if (node.type === "text" && node.value) {
    return splitOnWikiLinks(node.value)
      .map((segment) =>
        segment.type === "link" ? segment.link.label : segment.value
      )
      .join("");
  }
  return node.value ?? node.children?.map(textOf).join("") ?? "";
}

/** Structural checks only: no style score, suggested prose, or external requests. */
export function checkWriting(
  content: string,
  entries: LinkableEntry[]
): WritingCheck[] {
  const root = parser.parse(content) as CheckNode;
  const resolve = createResolver(entries);
  const paths = new Set(entries.map((entry) => entry.href));
  const headings = new Set<string>();
  const definitions = new Map<string, string>();
  const checks: WritingCheck[] = [];
  function walk(node: CheckNode, visit: (node: CheckNode) => void) {
    visit(node);
    node.children?.forEach((child) => walk(child, visit));
  }
  walk(root, (node) => {
    if (node.type === "definition" && node.identifier && node.url) {
      const key = node.identifier.toLowerCase();
      if (!definitions.has(key)) definitions.set(key, node.url);
    }
  });
  walk(root, (node) => {
    const line = node.position?.start.line ?? 1;
    if (node.type === "heading") {
      const heading = textOf(node).trim();
      const key = slug(heading.toLowerCase());
      if (headings.has(key))
        checks.push({
          kind: "repeated-heading",
          line,
          label: `Repeated heading: ${heading}`,
        });
      headings.add(key);
    }
    if (node.type === "text" && node.value) {
      for (const link of parseWikiLinks(node.value)) {
        if (!resolve(link.target))
          checks.push({
            kind: "missing-wiki",
            line,
            label: `Wiki page not found: ${link.target}`,
            target: link.target,
          });
      }
    }
    const url =
      node.type === "link"
        ? node.url
        : node.type === "linkReference" && node.identifier
          ? definitions.get(node.identifier.toLowerCase())
          : undefined;
    if (url && /^\/(wiki|posts)\//.test(url)) {
      try {
        const path = decodeURIComponent(url.split(/[?#]/)[0]).replace(
          /\/$/,
          ""
        );
        if (!paths.has(path))
          checks.push({
            kind: "missing-page",
            line,
            label: `Page not found: ${path}`,
          });
      } catch {
        checks.push({
          kind: "missing-page",
          line,
          label: `Invalid page link: ${url}`,
        });
      }
    }
  });
  return checks;
}
