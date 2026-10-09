import { createHash } from "node:crypto";
import type {
  KnowledgeMapOutput,
  KnowledgeMapPreview,
} from "@/types/knowledgeMap";

// Keep the complete map for server-side related posts. The browser can draw
// nodes first and request exactly their connections only when interacting.
export function splitKnowledgeMap(map: KnowledgeMapOutput) {
  const { similarityEdges, summaries, ...metadata } = map;
  const edgesJson = JSON.stringify(similarityEdges);
  const hash = createHash("sha256").update(edgesJson).digest("hex");
  const edgesFilename = `knowledge-map-edges-${hash}.json`;
  // One-line idea summaries are only needed once someone hovers a post, so
  // they ship as their own hashed file instead of riding in the first payload.
  let summariesJson: string | undefined;
  let summariesFilename: string | undefined;
  if (summaries && Object.keys(summaries).length > 0) {
    summariesJson = JSON.stringify(summaries);
    const summariesHash = createHash("sha256")
      .update(summariesJson)
      .digest("hex");
    summariesFilename = `knowledge-map-summaries-${summariesHash}.json`;
  }
  const preview: KnowledgeMapPreview = {
    ...metadata,
    similarityEdgesUrl: `/data/${edgesFilename}`,
    ...(summariesFilename && { summariesUrl: `/data/${summariesFilename}` }),
  };
  return {
    previewJson: JSON.stringify(preview),
    edgesJson,
    edgesFilename,
    summariesJson,
    summariesFilename,
  };
}
