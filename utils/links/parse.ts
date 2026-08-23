import type { ParsedLink } from "@/types/links";

/**
 * Matches a single `[[...]]` with no nested brackets inside. Global/sticky so a
 * single instance can drive both `parseWikiLinks` and `splitOnWikiLinks`.
 */
const WIKILINK = /\[\[([^\][|]+)(?:\|([^\][]+))?\]\]/g;

/** One piece of text after splitting on `[[links]]`: either plain text or a link. */
export type Segment =
  | { type: "text"; value: string }
  | { type: "link"; link: ParsedLink };

function toParsedLink(target: string, label?: string): ParsedLink | null {
  const t = target.trim();
  if (!t) return null;
  const l = label?.trim();
  return { target: t, label: l && l.length > 0 ? l : t };
}

/**
 * Split a string into an ordered run of text and link segments. This is the
 * shared primitive: the remark plugin maps segments → mdast nodes, and
 * `parseWikiLinks` keeps only the links. Empty `[[]]` targets stay as text.
 */
export function splitOnWikiLinks(text: string): Segment[] {
  const segments: Segment[] = [];
  let last = 0;
  WIKILINK.lastIndex = 0;
  for (let m = WIKILINK.exec(text); m; m = WIKILINK.exec(text)) {
    const link = toParsedLink(m[1], m[2]);
    if (!link) continue; // empty target — leave the raw `[[]]` in the text run
    if (m.index > last) {
      segments.push({ type: "text", value: text.slice(last, m.index) });
    }
    segments.push({ type: "link", link });
    last = m.index + m[0].length;
  }
  if (last < text.length) {
    segments.push({ type: "text", value: text.slice(last) });
  }
  return segments;
}

/** All `[[links]]` in a string, in order. Pure — no resolution. */
export function parseWikiLinks(text: string): ParsedLink[] {
  return splitOnWikiLinks(text)
    .filter((s): s is Extract<Segment, { type: "link" }> => s.type === "link")
    .map((s) => s.link);
}
