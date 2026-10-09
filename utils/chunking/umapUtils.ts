import { UMAP } from "umap-js";

// Fixed seed so the same posts always produce the same clusters and layout —
// keeps cluster labels reusable across builds and stops the map reshuffling.
const SEED = 42;

// mulberry32: tiny deterministic PRNG with the Math.random() signature
function seededRandom(seed: number = SEED): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface UMAPPosition {
  x: number;
  y: number;
}

/**
 * Reduce embeddings to nComponents dimensions for clustering.
 * Uses minDist=0.0 and high nNeighbors to emphasize global cluster structure
 * rather than local topology — this is the key to getting tight, separable clusters
 * before density clustering (the BERTopic two-stage approach).
 */
export function computeClusteringProjection(
  embeddings: number[][],
  nComponents: number = 10,
  neighbors: number = 30
): number[][] {
  if (embeddings.length === 0) return [];

  const nNeighbors = Math.min(neighbors, embeddings.length - 1);

  const umap = new UMAP({
    nComponents,
    nNeighbors,
    minDist: 0.0, // force points into tight clusters — ideal before clustering
    spread: 1.0,
    random: seededRandom(),
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
    // cluster ids (-1 = unlabeled) that pull same-cluster points together
    labels?: number[];
    targetWeight?: number;
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
    random: seededRandom(),
  });

  if (options?.labels) {
    umap.setSupervisedProjection(options.labels, {
      targetWeight: options.targetWeight ?? 0.5,
    });
  }

  const projection = umap.fit(embeddings);

  return projection.map((point: number[]) => ({
    x: point[0],
    y: point[1],
  }));
}

/**
 * Pull the most extreme points (outside the given percentile range on either
 * axis) onto the range edge so a few strays don't squash everything else
 * once positions are scaled to the canvas.
 */
export function clampOutliers(
  positions: UMAPPosition[],
  percentile: number = 0.01
): UMAPPosition[] {
  if (positions.length === 0) return [];
  const bounds = (values: number[]) => {
    const sorted = [...values].sort((a, b) => a - b);
    const lo = sorted[Math.floor(percentile * (sorted.length - 1))];
    const hi = sorted[Math.ceil((1 - percentile) * (sorted.length - 1))];
    return [lo, hi] as const;
  };
  const [x1, x2] = bounds(positions.map((p) => p.x));
  const [y1, y2] = bounds(positions.map((p) => p.y));
  const clamp = (v: number, lo: number, hi: number) =>
    Math.min(hi, Math.max(lo, v));
  return positions.map((p) => ({
    x: clamp(p.x, x1, x2),
    y: clamp(p.y, y1, y2),
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
