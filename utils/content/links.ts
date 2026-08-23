import { cache } from "react";
import { WIKI_DIR, POSTS_DIR } from "@/config/paths";
import type {
  ContentRef,
  LinkableEntry,
  LinkGraph,
  Resolver,
} from "@/types/links";
import { scanMarkdownDir } from "./markdown";
import { hrefFor, refKey } from "@/utils/links/refs";
import { createResolver } from "@/utils/links/resolve";
import { buildLinkGraph } from "@/utils/links/graph";

/** A LinkableEntry plus the raw body, kept together so we scan disk once. */
interface IndexedEntry extends LinkableEntry {
  content: string;
}

// Wiki is scanned before posts so that on a title collision the wiki page —
// the "concept home" — wins (createResolver keeps the first entry per key).
// scanMarkdownDir reads only top-level `.md`, so post drafts (in a subdir) and
// the absence of a wiki/ dir are both handled gracefully.
const scanEntries = cache(function scanEntries(): IndexedEntry[] {
  const wiki = scanMarkdownDir(WIKI_DIR).map(({ slug, data, content }) => {
    const ref: ContentRef = { kind: "wiki", slug };
    return {
      ref,
      title: (data.title as string) || slug,
      href: hrefFor(ref),
      content,
    };
  });
  const posts = scanMarkdownDir(POSTS_DIR).map(({ slug, data, content }) => {
    const ref: ContentRef = { kind: "post", slug };
    return {
      ref,
      title: (data.title as string) || slug,
      href: hrefFor(ref),
      content,
    };
  });
  return [...wiki, ...posts];
});

/** All linkable pages plus a resolver over them. */
export const getLinkIndex = cache(function getLinkIndex(): {
  entries: LinkableEntry[];
  resolve: Resolver;
} {
  const entries = scanEntries();
  return { entries, resolve: createResolver(entries) };
});

/** The directed link graph across all content. */
export const getLinkGraph = cache(function getLinkGraph(): LinkGraph {
  const entries = scanEntries();
  const bodyOf = new Map(entries.map((e) => [refKey(e.ref), e.content]));
  return buildLinkGraph(entries, (ref) => bodyOf.get(refKey(ref)) ?? "");
});

/** Pages that link to `ref` ("linked from"). */
export function getBacklinks(ref: ContentRef): LinkableEntry[] {
  return getLinkGraph().backlinks(ref);
}
