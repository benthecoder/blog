import type { ContentRef, LinkableEntry, LinkGraph } from "@/types/links";
import { parseWikiLinks } from "./parse";
import { createResolver } from "./resolve";
import { refKey, refsEqual } from "./refs";

/**
 * Build the directed link graph from every page's body. `getContent(ref)`
 * returns the raw markdown for a page. Edges are the resolved `[[links]]`;
 * unresolved links and self-links are dropped. Both directions are
 * pre-computed so `outlinks`/`backlinks` are O(1) lookups.
 */
export function buildLinkGraph(
  entries: LinkableEntry[],
  getContent: (ref: ContentRef) => string
): LinkGraph {
  const resolve = createResolver(entries);
  const out = new Map<string, LinkableEntry[]>();
  const back = new Map<string, LinkableEntry[]>();

  // Append `entry` to `map[key]`, skipping duplicates (a page may link another
  // more than once, but it should appear in the bucket only once).
  const add = (
    map: Map<string, LinkableEntry[]>,
    key: string,
    entry: LinkableEntry
  ) => {
    const bucket = map.get(key) ?? [];
    if (!bucket.some((e) => refsEqual(e.ref, entry.ref))) bucket.push(entry);
    map.set(key, bucket);
  };

  for (const source of entries) {
    for (const link of parseWikiLinks(getContent(source.ref))) {
      const target = resolve(link.target);
      if (!target || refsEqual(target.ref, source.ref)) continue;
      add(out, refKey(source.ref), target);
      add(back, refKey(target.ref), source);
    }
  }

  return {
    outlinks: (ref) => out.get(refKey(ref)) ?? [],
    backlinks: (ref) => back.get(refKey(ref)) ?? [],
  };
}
