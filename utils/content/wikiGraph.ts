import { cache } from "react";
import { getWikiMetadata } from "./wiki";
import { getLinkGraph } from "./links";

/** A node in the wiki graph: a domain hub, or a topic page. */
export interface WikiGraphNode {
  id: string;
  label: string;
  kind: "domain" | "topic";
  /** Topics only — the wiki slug to navigate to. */
  slug?: string;
}

/** An edge: `contain` = domain→child nesting, `ref` = a [[wikilink]] between topics. */
export interface WikiGraphEdge {
  source: string;
  target: string;
  kind: "contain" | "ref";
}

export interface WikiGraphData {
  nodes: WikiGraphNode[];
  edges: WikiGraphEdge[];
}

/**
 * Build the force-graph data from the wiki: category paths become a hub tree
 * (containment edges), and resolved [[wikilinks]] between pages become ref
 * edges. Computed at build time from the markdown — no precompute step.
 */
export const getWikiGraph = cache(function getWikiGraph(): WikiGraphData {
  const nodes = new Map<string, WikiGraphNode>();
  const edges: WikiGraphEdge[] = [];
  const seen = new Set<string>();

  const addEdge = (
    source: string,
    target: string,
    kind: WikiGraphEdge["kind"]
  ) => {
    // Ref edges are undirected; dedupe on the sorted pair. Containment is directed.
    const key =
      kind === "ref"
        ? `ref:${[source, target].sort().join("|")}`
        : `contain:${source}|${target}`;
    if (seen.has(key)) return;
    seen.add(key);
    edges.push({ source, target, kind });
  };

  const pages = getWikiMetadata();

  for (const page of pages) {
    const topicId = `topic:${page.slug}`;
    nodes.set(topicId, {
      id: topicId,
      label: page.title,
      kind: "topic",
      slug: page.slug,
    });

    // Walk the slash-path, creating a hub per segment and nesting edges.
    let prev: string | null = null;
    let path = "";
    for (const segment of page.category
      .split("/")
      .map((s) => s.trim())
      .filter(Boolean)) {
      path = path ? `${path}/${segment}` : segment;
      const domainId = `domain:${path}`;
      if (!nodes.has(domainId)) {
        nodes.set(domainId, { id: domainId, label: segment, kind: "domain" });
      }
      if (prev) addEdge(prev, domainId, "contain");
      prev = domainId;
    }
    if (prev) addEdge(prev, topicId, "contain");
  }

  // [[wikilinks]] between wiki pages become ref edges.
  const graph = getLinkGraph();
  for (const page of pages) {
    const sourceId = `topic:${page.slug}`;
    for (const target of graph.outlinks({ kind: "wiki", slug: page.slug })) {
      if (target.ref.kind === "wiki") {
        addEdge(sourceId, `topic:${target.ref.slug}`, "ref");
      }
    }
  }

  return { nodes: [...nodes.values()], edges };
});
