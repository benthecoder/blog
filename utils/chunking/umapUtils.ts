import { UMAP } from "umap-js";
import { kmeans } from "ml-kmeans";

export interface UMAPPosition {
  x: number;
  y: number;
}

export interface ClusterResult {
  labels: number[];
  numClusters: number;
}

/**
 * Compute 2D UMAP projection from high-dimensional embeddings
 * @param embeddings Array of 1024-dimensional vectors
 * @param options UMAP configuration options
 * @returns Array of 2D positions
 */
export function computeUMAP(
  embeddings: number[][],
  options?: {
    nNeighbors?: number;
    minDist?: number;
    spread?: number;
    random?: () => number;
  }
): UMAPPosition[] {
  if (embeddings.length === 0) {
    return [];
  }

  // UMAP parameters optimized for blog post clustering
  const nNeighbors = options?.nNeighbors ?? Math.min(15, embeddings.length - 1);
  const minDist = options?.minDist ?? 0.1;
  const spread = options?.spread ?? 1.0;

  const umap = new UMAP({
    nComponents: 2,
    nNeighbors,
    minDist,
    spread,
    random: options?.random,
  });

  // Fit and transform the embeddings
  const projection = umap.fit(embeddings);

  // Convert to position objects
  return projection.map((point: number[]) => ({
    x: point[0],
    y: point[1],
  }));
}

/**
 * Normalize positions to fit within a specific range
 * @param positions Array of 2D positions
 * @param width Target width
 * @param height Target height
 * @param padding Padding from edges
 * @returns Normalized positions
 */
export function normalizePositions(
  positions: UMAPPosition[],
  width: number,
  height: number,
  padding: number = 50
): UMAPPosition[] {
  if (positions.length === 0) return [];

  // Find bounds
  const xValues = positions.map((p) => p.x);
  const yValues = positions.map((p) => p.y);
  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);

  const rangeX = maxX - minX;
  const rangeY = maxY - minY;

  // Normalize to fit within bounds
  return positions.map((pos) => ({
    x: padding + ((pos.x - minX) / rangeX) * (width - 2 * padding),
    y: padding + ((pos.y - minY) / rangeY) * (height - 2 * padding),
  }));
}

/**
 * Perform k-means clustering on high-dimensional embeddings
 * @param embeddings Array of high-dimensional vectors
 * @param k Number of clusters (default: 15)
 * @returns Cluster labels for each point
 */
export function computeKMeans(
  embeddings: number[][],
  k: number = 15
): ClusterResult {
  if (embeddings.length === 0) {
    return { labels: [], numClusters: 0 };
  }

  // Adjust k if we have fewer data points
  const numClusters = Math.min(k, Math.floor(embeddings.length / 3));

  // Run k-means clustering
  const result = kmeans(embeddings, numClusters, {
    initialization: "kmeans++",
    maxIterations: 100,
  });

  return {
    labels: result.clusters,
    numClusters,
  };
}
