import fs from "fs";
import { KNOWLEDGE_MAP_JSON } from "@/config/paths";
import type { KnowledgeMapOutput } from "@/types/knowledgeMap";
import { buildRelatedIndex, type RelatedPost } from "./relatedIndex";
export type { RelatedPost } from "./relatedIndex";
const RETAINED_LIMIT = 4;

// slug → most similar posts, built once from the knowledge map's similarity
// edges (already thresholded at build time) and reused across pages.
let relatedBySlug: Map<string, RelatedPost[]> | null = null;

function buildIndex(limit = RETAINED_LIMIT): Map<string, RelatedPost[]> {
  if (!fs.existsSync(KNOWLEDGE_MAP_JSON)) return new Map();

  const map: KnowledgeMapOutput = JSON.parse(
    fs.readFileSync(KNOWLEDGE_MAP_JSON, "utf8")
  );

  return buildRelatedIndex(map, limit);
}

export function getRelatedPosts(slug: string, limit = 4): RelatedPost[] {
  // Current pages request four. Preserve larger explicit requests without
  // retaining every connection in memory for the lifetime of each worker.
  if (limit > RETAINED_LIMIT) return buildIndex(limit).get(slug) ?? [];
  relatedBySlug ??= buildIndex();
  return (relatedBySlug.get(slug) ?? []).slice(0, limit);
}
