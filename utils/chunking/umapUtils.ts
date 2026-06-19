import { UMAP } from "umap-js";
import { kmeans } from "ml-kmeans";

export interface UMAPPosition {
  x: number;
  y: number;
}

export interface ClusterResult {
  labels: number[];
  centroids: number[][];
  numClusters: number;
}

/**
 * Reduce embeddings to nComponents dimensions for clustering.
 * Uses minDist=0.0 and high nNeighbors to emphasize global cluster structure
 * rather than local topology — this is the key to getting tight, separable clusters
 * before running k-means (the BERTopic two-stage approach).
 */
export function computeClusteringProjection(
  embeddings: number[][],
  nComponents: number = 10
): number[][] {
  if (embeddings.length === 0) return [];

  const nNeighbors = Math.min(30, embeddings.length - 1);

  const umap = new UMAP({
    nComponents,
    nNeighbors,
    minDist: 0.0, // force points into tight clusters — ideal before k-means
    spread: 1.0,
  });

  return umap.fit(embeddings);
}

/**
 * Compute 2D UMAP for visualization only. Uses different params than the
 * clustering projection — minDist > 0 and larger spread so clusters fan out
 * visually and are easier to explore.
 */
export function computeVisualizationUMAP(
  embeddings: number[][],
  options?: {
    nNeighbors?: number;
    minDist?: number;
    spread?: number;
  }
): UMAPPosition[] {
  if (embeddings.length === 0) return [];

  const nNeighbors = options?.nNeighbors ?? Math.min(30, embeddings.length - 1);
  const minDist = options?.minDist ?? 0.05;
  const spread = options?.spread ?? 12.0;

  const umap = new UMAP({
    nComponents: 2,
    nNeighbors,
    minDist,
    spread,
  });

  const projection = umap.fit(embeddings);

  return projection.map((point: number[]) => ({
    x: point[0],
    y: point[1],
  }));
}

/**
 * Normalize 2D positions to fit within a canvas.
 */
export function normalizePositions(
  positions: UMAPPosition[],
  width: number,
  height: number,
  padding: number = 50
): UMAPPosition[] {
  if (positions.length === 0) return [];

  const xs = positions.map((p) => p.x);
  const ys = positions.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const rangeX = maxX - minX;
  const rangeY = maxY - minY;

  return positions.map((pos) => ({
    x: padding + ((pos.x - minX) / rangeX) * (width - 2 * padding),
    y: padding + ((pos.y - minY) / rangeY) * (height - 2 * padding),
  }));
}

/**
 * Cluster embeddings using k-means.
 * Returns labels, centroids, and actual number of clusters.
 */
export function computeKMeans(
  embeddings: number[][],
  k: number = 12
): ClusterResult {
  if (embeddings.length === 0) {
    return { labels: [], centroids: [], numClusters: 0 };
  }

  const numClusters = Math.min(k, Math.floor(embeddings.length / 3));

  const result = kmeans(embeddings, numClusters, {
    initialization: "kmeans++",
    maxIterations: 300,
  });

  return {
    labels: result.clusters,
    centroids: result.centroids,
    numClusters,
  };
}

/**
 * Merge clusters that are too small into the nearest large cluster,
 * measured by centroid distance. Returns a remapped label array and
 * the surviving cluster IDs.
 */
export function mergeSmallClusters(
  labels: number[],
  centroids: number[][],
  minSize: number
): { labels: number[]; activeClusters: Set<number> } {
  const counts = new Map<number, number>();
  labels.forEach((l) => counts.set(l, (counts.get(l) ?? 0) + 1));

  const small = new Set<number>();
  const large = new Set<number>();
  counts.forEach((count, id) => {
    if (count < minSize) small.add(id);
    else large.add(id);
  });

  if (small.size === 0) {
    return { labels, activeClusters: large };
  }

  // For each small cluster, find the nearest large cluster by centroid distance
  const remap = new Map<number, number>();
  small.forEach((smallId) => {
    let bestId = -1;
    let bestDist = Infinity;
    large.forEach((largeId) => {
      const dist = euclideanDistance(centroids[smallId], centroids[largeId]);
      if (dist < bestDist) {
        bestDist = dist;
        bestId = largeId;
      }
    });
    remap.set(smallId, bestId !== -1 ? bestId : Array.from(large)[0]);
  });

  const remapped = labels.map((l) => remap.get(l) ?? l);

  // Compact: re-index surviving clusters to 0..n
  const survivors = Array.from(large).sort((a, b) => a - b);
  const compact = new Map(survivors.map((id, i) => [id, i]));
  return {
    labels: remapped.map((l) => compact.get(l) ?? l),
    activeClusters: new Set(compact.values()),
  };
}

function euclideanDistance(a: number[], b: number[]): number {
  return Math.sqrt(a.reduce((sum, v, i) => sum + (v - b[i]) ** 2, 0));
}
