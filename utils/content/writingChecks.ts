import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import { slug } from "github-slugger";
import type { LinkableEntry } from "@/types/links";
import { parseWikiLinks, splitOnWikiLinks } from "@/utils/links/parse";
import { createResolver } from "@/utils/links/resolve";

type CheckNode = {
  type: string;
  position?: { start: { line: number } };
  children?: CheckNode[];
  value?: string;
  url?: string;
  identifier?: string;
};

/** A page a broken `[[link]]` probably meant. */
export interface LinkSuggestion {
  title: string;
  href: string;
}

export interface WritingCheck {
  kind: "missing-wiki" | "missing-page" | "repeated-heading";
  line: number;
  label: string;
  target?: string;
  /** For `missing-wiki`: closest existing pages, best first. */
  suggestions?: LinkSuggestion[];
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

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++)
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    prev = cur;
  }
  return prev[b.length];
}

/** 0..1 similarity: edit distance on the whole name, plus shared words and singular/plural. */
function similarity(target: string, candidate: string): number {
  const a = normalize(target);
  const b = normalize(candidate);
  if (!a || !b) return 0;
  const stem = (w: string) => w.replace(/(es|s)$/, "");
  if (a.split(" ").map(stem).join(" ") === b.split(" ").map(stem).join(" "))
    return 0.95;
  const chars = 1 - editDistance(a, b) / Math.max(a.length, b.length);
  const wa = new Set(a.split(" ").map(stem));
  const wb = new Set(b.split(" ").map(stem));
  const shared = [...wa].filter((w) => wb.has(w)).length;
  const words = shared / Math.max(wa.size, wb.size);
  const contains = b.includes(a) || a.includes(b) ? 0.75 : 0;
  return Math.max(chars, words * 0.9, contains);
}

/** Up to `limit` existing pages that a missing link target most likely meant. */
export function suggestTargets(
  target: string,
  entries: LinkableEntry[],
  limit = 3
): LinkSuggestion[] {
  return entries
    .map((entry) => ({
      entry,
      score: Math.max(
        similarity(target, entry.title),
        similarity(target, entry.ref.slug.replace(/[-_]/g, " "))
      ),
    }))
    .filter(({ score }) => score >= 0.6)
    .sort(
      (x, y) => y.score - x.score || x.entry.title.localeCompare(y.entry.title)
    )
    .slice(0, limit)
    .map(({ entry }) => ({ title: entry.title, href: entry.href }));
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
            suggestions: suggestTargets(link.target, entries),
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

/**
 * Point every `[[target]]` / `[[target|label]]` at `replacement`, keeping the
 * text the reader sees. Matching ignores case and extra whitespace, like the resolver.
 */
export function retargetWikiLinks(
  content: string,
  target: string,
  replacement: string
): string {
  const key = target.trim().toLowerCase().replace(/\s+/g, " ");
  return content.replace(
    /\[\[([^\][|]+)(?:\|([^\][]+))?\]\]/g,
    (match, raw: string, label?: string) => {
      if (raw.trim().toLowerCase().replace(/\s+/g, " ") !== key) return match;
      const shown = (label ?? raw).trim();
      return shown === replacement
        ? `[[${replacement}]]`
        : `[[${replacement}|${shown}]]`;
    }
  );
}
