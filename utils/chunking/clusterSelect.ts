import { hdbscan } from "./hdbscan";

export interface ClusterQuality {
  numClusters: number;
  noiseFraction: number;
  silhouette: number;
}

export interface ClusterSelection extends ClusterQuality {
  labels: number[];
  minClusterSize: number;
}

function euclid(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) ** 2;
  return Math.sqrt(s);
}

/** Mean silhouette over clustered points; noise (-1) is ignored. */
export function silhouetteScore(points: number[][], labels: number[]): number {
  const ids = Array.from(new Set(labels.filter((l) => l !== -1)));
  if (ids.length < 2) return 0;
  const members = new Map<number, number[]>(ids.map((id) => [id, []]));
  labels.forEach((l, i) => l !== -1 && members.get(l)!.push(i));

  let total = 0;
  let count = 0;
  labels.forEach((l, i) => {
    if (l === -1) return;
    const own = members.get(l)!;
    if (own.length < 2) return;
    let a = 0;
    for (const j of own) if (j !== i) a += euclid(points[i], points[j]);
    a /= own.length - 1;
    let b = Infinity;
    for (const id of ids) {
      if (id === l) continue;
      const other = members.get(id)!;
      let s = 0;
      for (const j of other) s += euclid(points[i], points[j]);
      b = Math.min(b, s / other.length);
    }
    total += (b - a) / Math.max(a, b);
    count++;
  });
  return count === 0 ? 0 : total / count;
}

export function clusterQuality(
  points: number[][],
  labels: number[]
): ClusterQuality {
  const clustered = labels.filter((l) => l !== -1);
  return {
    numClusters: new Set(clustered).size,
    noiseFraction: labels.length ? 1 - clustered.length / labels.length : 0,
    silhouette: silhouetteScore(points, labels),
  };
}

export interface SelectOptions {
  minClusterSizes: number[];
  minClusters: number;
  maxClusters: number;
  maxNoiseFraction: number;
  // clusters larger than this share of the points get split further
  maxFraction: number;
}

/** HDBSCAN, then split oversized groups and absorb obvious stragglers. */
export function clusterPoints(
  points: number[][],
  minClusterSize: number,
  maxFraction: number
): number[] {
  const base = hdbscan(points, { minClusterSize });
  return absorbNoise(
    points,
    splitOversized(points, base, minClusterSize, maxFraction)
  );
}

/**
 * Sweep HDBSCAN's min cluster size and keep the run with the best silhouette
 * among those with a readable number of groups and not too much noise.
 * Falls back to the closest-to-acceptable run if none qualify.
 */
export function selectClustering(
  points: number[][],
  options: SelectOptions
): ClusterSelection {
  const runs: ClusterSelection[] = options.minClusterSizes.map(
    (minClusterSize) => {
      const labels = clusterPoints(points, minClusterSize, options.maxFraction);
      return { minClusterSize, labels, ...clusterQuality(points, labels) };
    }
  );
  const ok = runs.filter(
    (r) =>
      r.numClusters >= options.minClusters &&
      r.numClusters <= options.maxClusters &&
      r.noiseFraction <= options.maxNoiseFraction
  );
  const pool = ok.length > 0 ? ok : runs;
  return pool.reduce((a, b) => (b.silhouette > a.silhouette ? b : a));
}

/**
 * Broad clusters hide structure (one blob swallowing half the corpus).
 * Re-cluster any group larger than `maxFraction` of the points using
 * HDBSCAN's finest stable groups; points that don't land in a sub-group
 * stay with the parent cluster so nothing is lost.
 */
export function splitOversized(
  points: number[][],
  labels: number[],
  minClusterSize: number,
  maxFraction: number
): number[] {
  const out = labels.slice();
  const limit = points.length * maxFraction;
  let nextId = Math.max(-1, ...labels) + 1;
  for (const id of new Set(labels)) {
    if (id === -1) continue;
    const idx = labels.flatMap((l, i) => (l === id ? [i] : []));
    if (idx.length <= limit) continue;
    const sub = hdbscan(
      idx.map((i) => points[i]),
      { minClusterSize, selection: "leaf" }
    );
    const found = new Set(sub.filter((l) => l !== -1));
    if (found.size < 2) continue;
    const remap = new Map<number, number>();
    sub.forEach((l, k) => {
      if (l === -1) return; // stays with the parent cluster id
      if (!remap.has(l)) remap.set(l, nextId++);
      out[idx[k]] = remap.get(l)!;
    });
  }
  return out;
}

/**
 * Give a noise point to a cluster when most of its nearest clustered
 * neighbours agree and it sits within that cluster's usual spread.
 */
export function absorbNoise(
  points: number[][],
  labels: number[],
  { k = 7, agree = 0.7 } = {}
): number[] {
  const out = labels.slice();
  const clustered = labels.flatMap((l, i) => (l === -1 ? [] : [i]));
  if (clustered.length < k) return out;

  // 90th percentile of nearest-neighbour distance inside each cluster
  const spread = new Map<number, number[]>();
  for (const i of clustered) {
    let nearest = Infinity;
    for (const j of clustered) {
      if (i === j || labels[j] !== labels[i]) continue;
      nearest = Math.min(nearest, euclid(points[i], points[j]));
    }
    if (nearest === Infinity) continue;
    const list = spread.get(labels[i]);
    if (list) list.push(nearest);
    else spread.set(labels[i], [nearest]);
  }
  const limit = new Map<number, number>();
  spread.forEach((d, id) => {
    d.sort((a, b) => a - b);
    limit.set(id, d[Math.floor(d.length * 0.9)]);
  });

  labels.forEach((l, i) => {
    if (l !== -1) return;
    const near = clustered
      .map((j) => ({ j, d: euclid(points[i], points[j]) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, k);
    const votes = new Map<number, number>();
    near.forEach(({ j }) =>
      votes.set(labels[j], (votes.get(labels[j]) ?? 0) + 1)
    );
    const [top, count] = Array.from(votes).sort((a, b) => b[1] - a[1])[0];
    const nearestSame = near.find(({ j }) => labels[j] === top)!;
    if (count / k >= agree && nearestSame.d <= (limit.get(top) ?? 0)) {
      out[i] = top;
    }
  });
  return out;
}

/** Renumber clusters 0..n-1 by descending size; noise stays -1. */
export function renumberBySize(labels: number[]): number[] {
  const counts = new Map<number, number>();
  labels.forEach((l) => l !== -1 && counts.set(l, (counts.get(l) ?? 0) + 1));
  const order = Array.from(counts)
    .sort((a, b) => b[1] - a[1] || a[0] - b[0])
    .map(([id]) => id);
  const remap = new Map(order.map((id, i) => [id, i]));
  return labels.map((l) => (l === -1 ? -1 : remap.get(l)!));
}
