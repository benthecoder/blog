import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import {
  computeClusteringProjection,
  computeVisualizationUMAP,
  normalizePositions,
  computeKMeans,
  mergeSmallClusters,
} from "../utils/chunking/umapUtils";
import { labelClusters } from "../utils/chunking/clusterLabeling";
import { parseEmbedding } from "../utils/chunking/embeddingUtils";
import {
  NUM_CLUSTERS,
  CLUSTER_MIN_SIZE,
  CLUSTERING_UMAP_COMPONENTS,
  SIMILARITY_EDGE_THRESHOLD,
} from "../config/constants";
import { DATA_DIR } from "../config/paths";
import type {
  KnowledgeMapOutput,
  ArticleNode,
  ArticleData,
  SimilarityEdge,
} from "../types/knowledgeMap";
import type { ChunkRow } from "../types/chunks";
import fs from "fs";
import path from "path";

const sql = neon(process.env.POSTGRES_URL!);

// Cheap DB fingerprint: the map only changes when embeddings do, so a
// count + latest timestamp is enough to decide whether to regenerate.
async function getSourceFingerprint(): Promise<string> {
  const rows = (await sql`
    SELECT count(*) AS count, max(created_at) AS latest
    FROM content_chunks
    WHERE embedding IS NOT NULL
  `) as unknown as { count: string; latest: string | null }[];
  return `${rows[0].count}:${rows[0].latest ?? "none"}`;
}

async function generateKnowledgeMap() {
  try {
    // Check if database connection is available
    if (!process.env.POSTGRES_URL) {
      console.warn("⚠️  POSTGRES_URL not available during build");
      console.warn("⚠️  Skipping knowledge map generation");
      console.warn(
        "⚠️  Knowledge map will use existing data or fail gracefully"
      );
      return;
    }

    const outputPath = path.join(DATA_DIR, "knowledge-map.json");
    const sourceFingerprint = await getSourceFingerprint();

    if (fs.existsSync(outputPath)) {
      try {
        const existing = JSON.parse(
          fs.readFileSync(outputPath, "utf8")
        ) as KnowledgeMapOutput;
        if (existing.sourceFingerprint === sourceFingerprint) {
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
      SELECT DISTINCT ON (post_slug)
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
      ORDER BY
        post_slug,
        CASE WHEN chunk_type = 'full-post' THEN 0 ELSE 1 END,
        sequence
    `) as unknown as ChunkRow[];

    console.log(`Fetched ${results.length} embeddings`);

    const parsedData = results
      .map((row, index) => ({
        id: row.id,
        postSlug: row.post_slug,
        postTitle: row.post_title,
        content: row.content,
        chunkType: row.chunk_type,
        metadata: row.metadata,
        sequence: row.sequence,
        embedding: parseEmbedding(row.embedding),
        publishedDate: row.metadata?.published_date,
        tags: row.metadata?.tags || [],
        createdAt: row.created_at,
        index,
      }))
      .filter((item) => item.embedding.length > 0);

    const embeddings = parsedData.map((item) => item.embedding);

    // Stage 1: Reduce to nD for clustering (minDist=0 forces tight cluster structure)
    console.log(
      `Computing ${CLUSTERING_UMAP_COMPONENTS}D clustering projection...`
    );
    const clusteringProjection = computeClusteringProjection(
      embeddings,
      CLUSTERING_UMAP_COMPONENTS
    );

    // Stage 2: K-means on the low-dimensional projection (much better than on 1024D)
    console.log("Computing k-means clusters...");
    const rawClusters = computeKMeans(clusteringProjection, NUM_CLUSTERS);

    // Stage 3: Merge clusters that are too small into their nearest neighbour
    const { labels: finalLabels, activeClusters } = mergeSmallClusters(
      rawClusters.labels,
      rawClusters.centroids,
      CLUSTER_MIN_SIZE
    );
    const numClusters = activeClusters.size;
    console.log(
      `Created ${rawClusters.numClusters} clusters → ${numClusters} after merging small ones`
    );

    // Group articles by cluster for labeling
    const clusterMap = new Map<number, ArticleData[]>();
    parsedData.forEach((item, index) => {
      const clusterId = finalLabels[index];
      if (!clusterMap.has(clusterId)) clusterMap.set(clusterId, []);
      clusterMap.get(clusterId)!.push({
        ...item,
        x: 0,
        y: 0,
        cluster: clusterId,
      });
    });

    // Stage 4: Label clusters using Anthropic API
    let clusterLabels: Record<number, string> | undefined;

    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const labelsMap = await labelClusters(clusterMap);
        if (labelsMap) {
          clusterLabels = Object.fromEntries(labelsMap);
        }
      } catch (error) {
        console.warn("⚠️  Cluster labeling failed, continuing without labels");
        console.warn(
          "⚠️  Error:",
          error instanceof Error ? error.message : error
        );
      }
    } else {
      console.warn("⚠️  ANTHROPIC_API_KEY not set, skipping cluster labeling");
    }

    // Stage 5: Separate 2D UMAP for visualization (larger spread, minDist > 0)
    console.log("Computing 2D visualization UMAP...");
    const vizPositions = computeVisualizationUMAP(embeddings);
    const normalizedPositions = normalizePositions(
      vizPositions,
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
      count: processedData.length,
      numClusters,
      clusterLabels,
      generatedAt: new Date().toISOString(),
      sourceFingerprint,
    };

    fs.writeFileSync(outputPath, JSON.stringify(output));

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
