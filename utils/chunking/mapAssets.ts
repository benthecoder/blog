import { createHash } from "node:crypto";
import type {
  KnowledgeMapOutput,
  KnowledgeMapPreview,
} from "@/types/knowledgeMap";

// Keep the complete map for server-side related posts. The browser can draw
// nodes first and request exactly their connections only when interacting.
export function splitKnowledgeMap(map: KnowledgeMapOutput) {
  // Summaries only shape the layout at build time; the browser never shows them.
  const { similarityEdges, summaries, ...metadata } = map;
  const edgesJson = JSON.stringify(similarityEdges);
  const hash = createHash("sha256").update(edgesJson).digest("hex");
  const edgesFilename = `knowledge-map-edges-${hash}.json`;
  const preview: KnowledgeMapPreview = {
    ...metadata,
    similarityEdgesUrl: `/data/${edgesFilename}`,
  };
  return {
    previewJson: JSON.stringify(preview),
    edgesJson,
    edgesFilename,
  };
}
