import fs from "fs";
import { KNOWLEDGE_MAP_JSON } from "@/config/paths";
import type { KnowledgeMapOutput } from "@/types/knowledgeMap";

export interface RelatedPost {
  slug: string;
  title: string;
  similarity: number;
}

// slug → most similar posts, built once from the knowledge map's similarity
// edges (already thresholded at build time) and reused across pages.
let relatedBySlug: Map<string, RelatedPost[]> | null = null;

function buildIndex(): Map<string, RelatedPost[]> {
  const index = new Map<string, RelatedPost[]>();
  if (!fs.existsSync(KNOWLEDGE_MAP_JSON)) return index;

  const map: KnowledgeMapOutput = JSON.parse(
    fs.readFileSync(KNOWLEDGE_MAP_JSON, "utf8")
  );

  const add = (from: number, to: number, similarity: number) => {
    const source = map.data[from];
    const target = map.data[to];
    if (!source || !target || source.postSlug === target.postSlug) return;
    let related = index.get(source.postSlug);
    if (!related) {
      related = [];
      index.set(source.postSlug, related);
    }
    related.push({
      slug: target.postSlug,
      title: target.postTitle,
      similarity,
    });
  };

  for (const [a, b, similarity] of map.similarityEdges) {
    add(a, b, similarity);
    add(b, a, similarity);
  }

  for (const posts of index.values()) {
    posts.sort((x, y) => y.similarity - x.similarity);
  }

  return index;
}

export function getRelatedPosts(slug: string, limit = 4): RelatedPost[] {
  relatedBySlug ??= buildIndex();
  return (relatedBySlug.get(slug) ?? []).slice(0, limit);
}
