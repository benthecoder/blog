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

export interface UMAPPosition3D extends UMAPPosition {
  z: number;
}

export interface VisualizationUMAPOptions {
  nNeighbors?: number;
  minDist?: number;
  spread?: number;
  // cluster ids (-1 = unlabeled) that pull same-cluster points together
  labels?: number[];
  targetWeight?: number;
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
  options?: VisualizationUMAPOptions
): UMAPPosition[] {
  return projectVisualization(embeddings, 2, options).map((point) => ({
    x: point[0],
    y: point[1],
  }));
}

/** Same layout as computeVisualizationUMAP, in three dimensions. */
export function computeVisualizationUMAP3D(
  embeddings: number[][],
  options?: VisualizationUMAPOptions
): UMAPPosition3D[] {
  return projectVisualization(embeddings, 3, options).map((point) => ({
    x: point[0],
    y: point[1],
    z: point[2],
  }));
}

function projectVisualization(
  embeddings: number[][],
  nComponents: number,
  options?: VisualizationUMAPOptions
): number[][] {
  if (embeddings.length === 0) return [];

  const nNeighbors = options?.nNeighbors ?? Math.min(30, embeddings.length - 1);
  const minDist = options?.minDist ?? 0.05;
  const spread = options?.spread ?? 12.0;

  const umap = new UMAP({
    nComponents,
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

  return umap.fit(embeddings);
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

/**
 * Clamp each axis to its percentile range, then scale the whole cloud
 * uniformly (aspect preserved) around its center into [-1, 1]³.
 */
export function normalizeCloud3D(
  positions: UMAPPosition3D[],
  percentile: number = 0.01
): UMAPPosition3D[] {
  if (positions.length === 0) return [];
  const axes = ["x", "y", "z"] as const;
  const clamped = positions.map((p) => ({ ...p }));
  const mid: Record<string, number> = {};
  let half = 0;
  for (const axis of axes) {
    const sorted = positions.map((p) => p[axis]).sort((a, b) => a - b);
    const lo = sorted[Math.floor(percentile * (sorted.length - 1))];
    const hi = sorted[Math.ceil((1 - percentile) * (sorted.length - 1))];
    for (const p of clamped) p[axis] = Math.min(hi, Math.max(lo, p[axis]));
    mid[axis] = (lo + hi) / 2;
    half = Math.max(half, (hi - lo) / 2);
  }
  const scale = half > 0 ? 1 / half : 1;
  return clamped.map((p) => ({
    x: (p.x - mid.x) * scale,
    y: (p.y - mid.y) * scale,
    z: (p.z - mid.z) * scale,
  }));
}
