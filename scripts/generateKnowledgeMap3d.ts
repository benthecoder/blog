import "dotenv/config";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import fs from "fs";
import {
  computeVisualizationUMAP3D,
  normalizeCloud3D,
} from "../utils/chunking/umapUtils";
import {
  buildPostVectors,
  centerAndNormalize,
} from "../utils/chunking/postVectors";
import {
  embedTexts,
  imputeMissing,
  localEmbedder,
} from "../utils/chunking/summaryEmbeddings";
import { parseEmbedding } from "../utils/chunking/embeddingUtils";
import { KNOWLEDGE_MAP_3D_JSON, KNOWLEDGE_MAP_JSON } from "../config/paths";
import type { KnowledgeMapOutput } from "../types/knowledgeMap";
import type { ChunkRow } from "../types/chunks";

const SUMMARY_VECTOR_CACHE = ".cache/map-summary-vectors.json";

interface Map3dOutput {
  generatedAt: string;
  sourceFingerprint: string;
  points: Record<string, [number, number, number]>;
}

async function main() {
  if (!fs.existsSync(KNOWLEDGE_MAP_JSON)) {
    throw new Error(
      "knowledge-map.json is missing; run generate:knowledge-map"
    );
  }
  if (!process.env.POSTGRES_URL) throw new Error("POSTGRES_URL is not set");

  const map = JSON.parse(
    fs.readFileSync(KNOWLEDGE_MAP_JSON, "utf8")
  ) as KnowledgeMapOutput;
  const sourceFingerprint = map.sourceFingerprint ?? "unknown";

  if (fs.existsSync(KNOWLEDGE_MAP_3D_JSON)) {
    const existing = JSON.parse(
      fs.readFileSync(KNOWLEDGE_MAP_3D_JSON, "utf8")
    ) as Map3dOutput;
    if (existing.sourceFingerprint === sourceFingerprint) {
      console.log(`✓ 3D map up to date (fingerprint ${sourceFingerprint})`);
      return;
    }
  }

  const sql: NeonQueryFunction<false, false> = neon(process.env.POSTGRES_URL);
  console.log("Fetching embeddings from database...");
  const rows = (await sql`
    SELECT post_slug, content, chunk_type, embedding
    FROM content_chunks
    WHERE embedding IS NOT NULL
    ORDER BY post_slug, sequence
  `) as unknown as ChunkRow[];

  // Same per-post vectors as the 2D map: content vectors, replaced by the
  // embedded idea summaries (kept in knowledge-map.json) where there is one.
  // Only posts in the published 2D map (the database may hold newer ones).
  const inMap = new Set(map.data.map((n) => n.postSlug));
  const postVectors = buildPostVectors(
    rows.map((row) => ({
      postSlug: row.post_slug,
      chunkType: row.chunk_type,
      content: row.content,
      embedding: parseEmbedding(row.embedding),
    }))
  ).filter((p) => inMap.has(p.postSlug));
  const centeredContent = centerAndNormalize(postVectors.map((p) => p.vector));

  const summaries = map.summaries ?? {};
  let centered = centeredContent;
  const present = postVectors.flatMap((p, i) =>
    summaries[p.postSlug] ? [i] : []
  );
  if (present.length > 0) {
    console.log(`Embedding ${present.length} summaries locally...`);
    const { vectors: embedded } = await embedTexts(
      present.map((i) => summaries[postVectors[i].postSlug]),
      SUMMARY_VECTOR_CACHE,
      localEmbedder
    );
    const vectors: (number[] | null)[] = postVectors.map(() => null);
    present.forEach((postIndex, j) => (vectors[postIndex] = embedded[j]));
    centered = centerAndNormalize(imputeMissing(vectors, centeredContent));
  }

  // Cluster ids come from the published 2D map so colors/labels line up.
  const clusterBySlug = new Map(map.data.map((n) => [n.postSlug, n.cluster]));
  const labels = postVectors.map((p) => clusterBySlug.get(p.postSlug) ?? -1);

  console.log("Computing 3D visualization UMAP...");
  const positions = normalizeCloud3D(
    computeVisualizationUMAP3D(centered, {
      nNeighbors: 15,
      minDist: 0.4,
      spread: 3,
      labels,
      targetWeight: 0.4,
    })
  );

  const points: Map3dOutput["points"] = {};
  const round = (v: number) => Math.round(v * 1000) / 1000;
  postVectors.forEach((p, i) => {
    points[p.postSlug] = [
      round(positions[i].x),
      round(positions[i].y),
      round(positions[i].z),
    ];
  });

  const output: Map3dOutput = {
    generatedAt: new Date().toISOString(),
    sourceFingerprint,
    points,
  };
  fs.writeFileSync(KNOWLEDGE_MAP_3D_JSON, JSON.stringify(output));
  console.log(
    `✓ ${Object.keys(points).length} points -> ${KNOWLEDGE_MAP_3D_JSON}`
  );
}

main().catch((error) => {
  console.error("Error generating 3D knowledge map:", error);
  process.exit(1);
});
