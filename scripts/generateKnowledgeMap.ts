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
} from "../config/constants";
import type {
  KnowledgeMapOutput,
  ArticleNode,
  ArticleData,
} from "../types/knowledgeMap";
import type { ChunkRow } from "../types/chunks";
import fs from "fs";
import path from "path";

const sql = neon(process.env.POSTGRES_URL!);

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
      embedding: item.embedding.map((v) => Math.round(v * 10000) / 10000),
      publishedDate: item.publishedDate,
      tags: item.tags,
      x: normalizedPositions[index].x,
      y: normalizedPositions[index].y,
      cluster: finalLabels[index],
    }));

    // Create public/data directory if it doesn't exist
    const dataDir = path.join(process.cwd(), "public", "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Write to file
    const outputPath = path.join(dataDir, "knowledge-map.json");

    const output: KnowledgeMapOutput = {
      success: true,
      data: processedData,
      count: processedData.length,
      numClusters,
      clusterLabels,
      generatedAt: new Date().toISOString(),
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
