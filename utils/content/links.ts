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
type LinkIndex = { entries: LinkableEntry[]; resolve: Resolver };
let deployedSnapshot: { index: LinkIndex; graph: LinkGraph } | null = null;
const immutableDeployment = () =>
  process.env.NODE_ENV === "production" && process.env.VERCEL === "1";

function createIndex(entries: IndexedEntry[]): LinkIndex {
  // Raw bodies are useful only while deriving the graph. Never expose them
  // through the public index or serialize them into an authoring component.
  const metadata = entries.map(({ ref, title, href }) => ({
    ref,
    title,
    href,
  }));
  return { entries: metadata, resolve: createResolver(metadata) };
}

function createGraph(entries: IndexedEntry[], index: LinkIndex): LinkGraph {
  const bodyOf = new Map(entries.map((e) => [refKey(e.ref), e.content]));
  return buildLinkGraph(index.entries, (ref) => bodyOf.get(refKey(ref)) ?? "");
}

function getDeployedSnapshot() {
  if (!deployedSnapshot) {
    const entries = scanEntries();
    const index = createIndex(entries);
    deployedSnapshot = { index, graph: createGraph(entries, index) };
  }
  return deployedSnapshot;
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
export const getLinkIndex = cache(function getLinkIndex(): LinkIndex {
  if (immutableDeployment()) return getDeployedSnapshot().index;
  return createIndex(scanEntries());
});

/** The directed link graph across all content. */
export const getLinkGraph = cache(function getLinkGraph(): LinkGraph {
  if (immutableDeployment()) return getDeployedSnapshot().graph;
  const entries = scanEntries();
  return createGraph(entries, createIndex(entries));
});

/** Pages that link to `ref` ("linked from"). */
export function getBacklinks(ref: ContentRef): LinkableEntry[] {
  return getLinkGraph().backlinks(ref);
}
