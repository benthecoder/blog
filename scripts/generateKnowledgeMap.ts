import "dotenv/config";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import {
  computeClusteringProjection,
  clampOutliers,
  computeVisualizationUMAP,
  normalizePositions,
} from "../utils/chunking/umapUtils";
import { labelClusters } from "../utils/chunking/clusterLabeling";
import {
  cleanPostText,
  hashText,
  loadCache,
  pendingSummaries,
  readFrontmatter,
  saveCache,
  summarizePending,
  type SummaryCache,
  type SummaryInput,
} from "../utils/chunking/postSummaries";
import {
  embedTexts,
  imputeMissing,
  localEmbedder,
  type Embedder,
} from "../utils/chunking/summaryEmbeddings";
import { hasLlmKey } from "../utils/llm";
import { parseEmbedding } from "../utils/chunking/embeddingUtils";
import {
  buildPostVectors,
  centerAndNormalize,
} from "../utils/chunking/postVectors";
import {
  clusterQuality,
  renumberBySize,
  wardClustering,
} from "../utils/chunking/clusterSelect";
import {
  distinctiveTerms,
  nearestToCentroid,
} from "../utils/chunking/clusterTerms";
import {
  CLUSTERING_UMAP_COMPONENTS,
  CLUSTERING_UMAP_NEIGHBORS,
  CLUSTER_MIN_COUNT,
  CLUSTER_MAX_COUNT,
  CLUSTER_MAX_FRACTION,
  CLUSTER_MERGE_THRESHOLD,
  CLUSTER_NOISE_SILHOUETTE,
  CLUSTER_MIN_SIZE,
  CLUSTER_LABEL_TOP_TERMS,
  SUMMARY_BATCH_SIZE,
  SUMMARY_MAX_REQUESTS,
  SUMMARY_MAX_CHARS,
  SIMILARITY_EDGE_THRESHOLD,
} from "../config/constants";
import {
  DATA_DIR,
  KNOWLEDGE_MAP_JSON,
  KNOWLEDGE_MAP_NODES_JSON,
} from "../config/paths";
import { splitKnowledgeMap } from "../utils/chunking/mapAssets";
import { POSTS_DIR } from "../config/paths";
import type {
  KnowledgeMapOutput,
  ArticleNode,
  ArticleData,
  SimilarityEdge,
  PreviousClusterLabel,
} from "../types/knowledgeMap";
import type { ChunkRow } from "../types/chunks";
import fs from "fs";
import path from "path";

const SUMMARY_CACHE = ".cache/map-summaries.json";
const SUMMARY_VECTOR_CACHE = ".cache/map-summary-vectors.json";

function writeBrowserAssets(map: KnowledgeMapOutput) {
  const {
    previewJson,
    edgesJson,
    edgesFilename,
    summariesJson,
    summariesFilename,
  } = splitKnowledgeMap(map);
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const keep = new Set([edgesFilename, summariesFilename]);
  // hashed files from earlier snapshots are dead weight once nodes point elsewhere
  for (const file of fs.readdirSync(DATA_DIR)) {
    if (
      /^knowledge-map-(edges|summaries)-[a-f0-9]{64}\.json$/.test(file) &&
      !keep.has(file)
    ) {
      fs.rmSync(path.join(DATA_DIR, file));
    }
  }
  fs.writeFileSync(path.join(DATA_DIR, edgesFilename), edgesJson);
  if (summariesFilename && summariesJson) {
    fs.writeFileSync(path.join(DATA_DIR, summariesFilename), summariesJson);
  }
  fs.writeFileSync(KNOWLEDGE_MAP_NODES_JSON, previewJson);
}

// Posts are read straight from the markdown files; the slug is the file name.
function loadSummaryInputs(slugs: string[]) {
  const items: (SummaryInput & { hash: string })[] = [];
  for (const slug of slugs) {
    const file = path.join(POSTS_DIR, `${slug}.md`);
    if (!fs.existsSync(file)) continue;
    const markdown = fs.readFileSync(file, "utf8");
    const { title, tags } = readFrontmatter(markdown);
    const text = cleanPostText(markdown, SUMMARY_MAX_CHARS);
    items.push({
      slug,
      title,
      tags,
      text,
      hash: hashText(`${title}\n${text}`),
    });
  }
  return items;
}

// Cheap DB fingerprint: the map only changes when embeddings do, so a
// count + latest timestamp is enough to decide whether to regenerate.
async function getSourceFingerprint(
  sql: NeonQueryFunction<false, false>
): Promise<string> {
  const rows = (await sql`
    SELECT count(*) AS count, max(created_at) AS latest
    FROM content_chunks
    WHERE embedding IS NOT NULL
  `) as unknown as { count: string; latest: string | null }[];
  // bump the suffix when the clustering pipeline changes
  return `${rows[0].count}:${rows[0].latest ?? "none"}:v5`;
}

function previousClusterLabels(
  existing: KnowledgeMapOutput | undefined
): PreviousClusterLabel[] {
  if (!existing?.clusterLabels) return [];
  return Object.entries(existing.clusterLabels).map(([id, label]) => ({
    label,
    slugs: existing.data
      .filter((node) => node.cluster === Number(id))
      .map((node) => node.postSlug),
  }));
}

function clusterSizes(labels: number[]): Map<number, number> {
  const sizes = new Map<number, number>();
  labels.forEach((l) => sizes.set(l, (sizes.get(l) ?? 0) + 1));
  return sizes;
}

function printComparison(
  before: KnowledgeMapOutput | undefined,
  labels: number[],
  names: Record<number, string> | undefined,
  quality: { silhouette: number; noiseFraction: number; numClusters: number }
) {
  if (before) {
    const sizes = clusterSizes(before.data.map((n) => n.cluster));
    console.log("\nBefore:");
    console.log(`  clusters: ${before.numClusters}`);
    Array.from(sizes)
      .sort((a, b) => b[1] - a[1])
      .forEach(([id, n]) =>
        console.log(`  ${n}\t${before.clusterLabels?.[id] ?? id}`)
      );
  }
  const sizes = clusterSizes(labels);
  console.log("\nAfter:");
  console.log(
    `  clusters: ${quality.numClusters}, noise: ${(quality.noiseFraction * 100).toFixed(1)}%, silhouette: ${quality.silhouette.toFixed(3)}`
  );
  Array.from(sizes)
    .sort((a, b) => b[1] - a[1])
    .forEach(([id, n]) =>
      console.log(`  ${n}\t${id === -1 ? "(noise)" : (names?.[id] ?? id)}`)
    );
}

async function generateKnowledgeMap() {
  try {
    // Deployment builds consume versioned assets, not mutable provider data.
    // Regenerate locally and commit the snapshot when embeddings change.
    if (process.env.VERCEL === "1") {
      if (!fs.existsSync(KNOWLEDGE_MAP_JSON)) {
        throw new Error(
          "Committed knowledge-map.json is missing; generate it locally and commit it before deploying"
        );
      }
      const existing = JSON.parse(
        fs.readFileSync(KNOWLEDGE_MAP_JSON, "utf8")
      ) as KnowledgeMapOutput;
      writeBrowserAssets(existing);
      console.log(
        "✓ Using committed knowledge map; no provider query during deployment prebuild"
      );
      return;
    }
    // Check if database connection is available
    if (!process.env.POSTGRES_URL) {
      console.warn("⚠️  POSTGRES_URL not available during build");
      console.warn("⚠️  Skipping knowledge map generation");
      console.warn(
        "⚠️  Knowledge map will use existing data or fail gracefully"
      );
      if (fs.existsSync(KNOWLEDGE_MAP_JSON)) {
        writeBrowserAssets(
          JSON.parse(
            fs.readFileSync(KNOWLEDGE_MAP_JSON, "utf8")
          ) as KnowledgeMapOutput
        );
      }
      return;
    }

    const outputPath = KNOWLEDGE_MAP_JSON;
    const sql = neon(process.env.POSTGRES_URL);
    const sourceFingerprint = await getSourceFingerprint(sql);

    let existing: KnowledgeMapOutput | undefined;
    if (fs.existsSync(outputPath)) {
      try {
        existing = JSON.parse(
          fs.readFileSync(outputPath, "utf8")
        ) as KnowledgeMapOutput;
        const hasFallbackLabel = Object.values(
          existing.clusterLabels ?? {}
        ).some((label) => /^Cluster -?\d+$/.test(label));
        const summariesPending = pendingSummaries(
          loadSummaryInputs(existing.data.map((n) => n.postSlug)),
          loadCache<SummaryCache>(SUMMARY_CACHE, {})
        ).length;
        if (
          existing.sourceFingerprint === sourceFingerprint &&
          !hasFallbackLabel &&
          (summariesPending === 0 || !process.env.OPENROUTER_API_KEY)
        ) {
          writeBrowserAssets(existing);
          console.log(
            `✓ Knowledge map up to date (fingerprint ${sourceFingerprint}), skipping generation`
          );
          return;
        }
      } catch {
        // unreadable/corrupt file: fall through and regenerate
      }
    }

    console.log("Fetching embeddings from database...");

    const results = (await sql`
      SELECT
        id,
        post_slug,
        post_title,
        content,
        chunk_type,
        metadata,
        sequence,
        embedding,
        created_at
      FROM content_chunks
      WHERE embedding IS NOT NULL
      ORDER BY post_slug, sequence
    `) as unknown as ChunkRow[];

    console.log(`Fetched ${results.length} chunks`);

    const chunks = results.map((row) => ({
      postSlug: row.post_slug,
      chunkType: row.chunk_type,
      content: row.content,
      embedding: parseEmbedding(row.embedding),
    }));
    // One vector per post from its content-bearing chunks
    const postVectors = buildPostVectors(chunks);

    // Post metadata comes from the full-post row when there is one
    const rowBySlug = new Map<string, ChunkRow>();
    for (const row of results) {
      const seen = rowBySlug.get(row.post_slug);
      if (
        !seen ||
        (row.chunk_type === "full-post" && seen.chunk_type !== "full-post")
      ) {
        rowBySlug.set(row.post_slug, row);
      }
    }

    const parsedData = postVectors.map((pv, index) => {
      const row = rowBySlug.get(pv.postSlug)!;
      return {
        id: row.id,
        postSlug: row.post_slug,
        postTitle: row.post_title,
        content: row.content,
        chunkType: row.chunk_type,
        metadata: row.metadata,
        sequence: row.sequence,
        embedding: pv.vector,
        publishedDate: row.metadata?.published_date,
        tags: row.metadata?.tags || [],
        createdAt: row.created_at,
        index,
      };
    });

    const embeddings = parsedData.map((item) => item.embedding);
    // Centered + unit-normalized so the shared embedding direction doesn't
    // dominate; used for clustering only
    const centeredContent = centerAndNormalize(embeddings);

    // Idea summaries: what each post is about, free of logistics. Written by
    // an LLM in batches (resumable cache), then embedded locally.
    const summaryInputs = loadSummaryInputs(parsedData.map((p) => p.postSlug));
    const summaryCache = loadCache<SummaryCache>(SUMMARY_CACHE, {});
    const pending = pendingSummaries(summaryInputs, summaryCache);
    if (pending.length > 0 && hasLlmKey()) {
      console.log(`Summarizing ${pending.length} posts...`);
      const { requests, stoppedBy } = await summarizePending(
        pending,
        summaryCache,
        (cache) => saveCache(SUMMARY_CACHE, cache),
        {
          batchSize: SUMMARY_BATCH_SIZE,
          maxRequests: SUMMARY_MAX_REQUESTS,
          delayMs: 6000,
        }
      );
      console.log(`  ${requests} requests, stopped: ${stoppedBy}`);
    }
    const inputBySlug = new Map(summaryInputs.map((i) => [i.slug, i]));
    const summaryOf = (slug: string) => {
      const entry = summaryCache[slug];
      return entry && entry.hash === inputBySlug.get(slug)?.hash
        ? entry.summary
        : undefined;
    };
    const summaries: Record<string, string> = {};
    parsedData.forEach((p) => {
      const summary = summaryOf(p.postSlug);
      if (summary) {
        summaries[p.postSlug] = summary;
        (p as { summary?: string }).summary = summary;
      }
    });
    const missingSummaries = parsedData.length - Object.keys(summaries).length;
    console.log(
      `Summaries: ${Object.keys(summaries).length}/${parsedData.length} posts (${missingSummaries} fall back to their content vector)`
    );

    let centered = centeredContent;
    if (Object.keys(summaries).length > 0) {
      console.log("Embedding summaries...");
      const summaryTexts = parsedData.map((p) => summaries[p.postSlug]);
      const present = summaryTexts.flatMap((t, i) => (t ? [i] : []));
      const presentTexts = present.map((i) => summaryTexts[i]);
      // Gemini embeddings exceed the free tier quota on a bulk run, so vectors
      // come from a small local model (cached by summary hash)
      const embedder: Embedder = localEmbedder;
      const result = await embedTexts(
        presentTexts,
        SUMMARY_VECTOR_CACHE,
        embedder
      );
      console.log(
        `  vectors: ${embedder.name}, ${result.embedded} newly embedded`
      );
      const embedded = result.vectors;
      const vectors: (number[] | null)[] = parsedData.map(() => null);
      present.forEach((postIndex, j) => (vectors[postIndex] = embedded[j]));
      centered = centerAndNormalize(imputeMissing(vectors, centeredContent));
    }

    console.log(
      `Computing ${CLUSTERING_UMAP_COMPONENTS}D clustering projection...`
    );
    const clusteringProjection = computeClusteringProjection(
      centered,
      CLUSTERING_UMAP_COMPONENTS,
      CLUSTERING_UMAP_NEIGHBORS
    );

    console.log("Clustering with Ward linkage...");
    const finalLabels = renumberBySize(
      wardClustering(clusteringProjection, {
        minClusters: CLUSTER_MIN_COUNT,
        maxClusters: CLUSTER_MAX_COUNT,
        maxFraction: CLUSTER_MAX_FRACTION,
        mergeThreshold: CLUSTER_MERGE_THRESHOLD,
        noiseSilhouette: CLUSTER_NOISE_SILHOUETTE,
        minSize: CLUSTER_MIN_SIZE,
      })
    );
    const quality = clusterQuality(clusteringProjection, finalLabels);
    const numClusters = quality.numClusters;

    const clusterMap = new Map<number, ArticleData[]>();
    const memberIdx = new Map<number, number[]>();
    finalLabels.forEach((clusterId, index) => {
      if (!memberIdx.has(clusterId)) memberIdx.set(clusterId, []);
      memberIdx.get(clusterId)!.push(index);
    });
    memberIdx.forEach((members, clusterId) => {
      // nearest the cluster centre first, so the labeler sees typical posts
      const ordered = nearestToCentroid(clusteringProjection, members);
      clusterMap.set(
        clusterId,
        ordered.map((i) => ({
          ...parsedData[i],
          x: 0,
          y: 0,
          cluster: clusterId,
        }))
      );
    });
    const terms = distinctiveTerms(
      new Map(
        Array.from(clusterMap, ([id, arts]) => [
          id,
          arts.map((a) => ({
            title: a.postTitle,
            content: a.summary ?? a.content,
          })),
        ])
      ),
      CLUSTER_LABEL_TOP_TERMS
    );

    // Label clusters, reusing the previous map's labels where the
    // membership still matches so only new/changed clusters hit the model
    let clusterLabels: Record<number, string> | undefined;

    try {
      const labelsMap = await labelClusters(clusterMap, {
        previous: previousClusterLabels(existing),
        terms,
      });
      if (labelsMap.size > 0) clusterLabels = Object.fromEntries(labelsMap);
    } catch (error) {
      console.warn("⚠️  Cluster labeling failed, continuing without labels");
      console.warn(
        "⚠️  Error:",
        error instanceof Error ? error.message : error
      );
    }

    // 2D layout supervised by the clusters so each one stays contiguous
    console.log("Computing 2D visualization UMAP...");
    const vizPositions = computeVisualizationUMAP(centered, {
      nNeighbors: 15,
      minDist: 0.4,
      spread: 3,
      labels: finalLabels,
      targetWeight: 0.4,
    });
    const normalizedPositions = normalizePositions(
      clampOutliers(vizPositions),
      1000,
      1000,
      50
    );

    const processedData: ArticleNode[] = parsedData.map((item, index) => ({
      id: item.id,
      postSlug: item.postSlug,
      postTitle: item.postTitle,
      wordCount: item.content.split(/\s+/).length,
      publishedDate: item.publishedDate,
      tags: item.tags,
      x: Math.round(normalizedPositions[index].x * 100) / 100,
      y: Math.round(normalizedPositions[index].y * 100) / 100,
      cluster: finalLabels[index],
    }));

    printComparison(existing, finalLabels, clusterLabels, quality);

    // Precompute similarity edges so the client never needs raw embeddings
    console.log("Computing similarity edges...");
    const norms = embeddings.map((e) =>
      Math.sqrt(e.reduce((sum, v) => sum + v * v, 0))
    );
    const similarityEdges: SimilarityEdge[] = [];
    for (let i = 0; i < embeddings.length; i++) {
      const a = embeddings[i];
      for (let j = i + 1; j < embeddings.length; j++) {
        const b = embeddings[j];
        let dot = 0;
        for (let k = 0; k < a.length; k++) dot += a[k] * b[k];
        const sim = dot / (norms[i] * norms[j]);
        if (sim > SIMILARITY_EDGE_THRESHOLD) {
          similarityEdges.push([i, j, Math.round(sim * 1000) / 1000]);
        }
      }
    }
    console.log(`  ${similarityEdges.length} edges above threshold`);

    // Create public/data directory if it doesn't exist
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    const output: KnowledgeMapOutput = {
      success: true,
      data: processedData,
      similarityEdges,
      summaries,
      count: processedData.length,
      numClusters,
      clusterLabels,
      generatedAt: new Date().toISOString(),
      sourceFingerprint,
    };

    fs.writeFileSync(outputPath, JSON.stringify(output));
    writeBrowserAssets(output);

    console.log(`✓ Knowledge map generated: ${outputPath}`);
    console.log(`  ${processedData.length} articles processed`);
    console.log(`  ${numClusters} clusters found`);
    if (clusterLabels) {
      console.log(`  ${Object.keys(clusterLabels).length} clusters labeled`);
    }
  } catch (error) {
    console.error("Error generating knowledge map:", error);
    process.exit(1);
  }
}

generateKnowledgeMap();
