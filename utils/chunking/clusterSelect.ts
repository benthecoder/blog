import { pointSilhouettes, wardPartitions } from "./ward";

export interface ClusterQuality {
  numClusters: number;
  noiseFraction: number;
  silhouette: number;
}

function euclid(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) ** 2;
  return Math.sqrt(s);
}

/** Mean silhouette over clustered points; noise (-1) is ignored. */
export function silhouetteScore(points: number[][], labels: number[]): number {
  const keep = labels.flatMap((l, i) => (l === -1 ? [] : [i]));
  const sub = pointSilhouettes(
    keep.map((i) => points[i]),
    keep.map((i) => labels[i])
  );
  return sub.length === 0 ? 0 : sub.reduce((s, v) => s + v, 0) / sub.length;
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

function centroidOf(points: number[][], members: number[]): number[] {
  const c = Array.from({ length: points[0].length }, () => 0);
  for (const m of members)
    for (let d = 0; d < c.length; d++) c[d] += points[m][d] / members.length;
  return c;
}

function groups(labels: number[]): Map<number, number[]> {
  const out = new Map<number, number[]>();
  labels.forEach((l, i) => {
    if (l === -1) return;
    const list = out.get(l);
    if (list) list.push(i);
    else out.set(l, [i]);
  });
  return out;
}

/** Pairwise separation between clusters, smallest first: centre distance
 * divided by the sum of the clusters' mean radii. */
export function clusterSeparations(points: number[][], labels: number[]) {
  const stats = Array.from(groups(labels), ([id, idx]) => {
    const c = centroidOf(points, idx);
    const r = idx.reduce((s, i) => s + euclid(points[i], c), 0) / idx.length;
    return { id, c, r };
  });
  const out: { a: number; b: number; sep: number }[] = [];
  for (let i = 0; i < stats.length; i++)
    for (let j = i + 1; j < stats.length; j++)
      out.push({
        a: stats[i].id,
        b: stats[j].id,
        sep:
          euclid(stats[i].c, stats[j].c) /
          Math.max(stats[i].r + stats[j].r, 1e-9),
      });
  return out.sort((x, y) => x.sep - y.sep);
}

/**
 * Merge clusters whose centres are close compared with how spread out they
 * are (see clusterSeparations). The closest pair under `threshold` merges
 * first and the process repeats, so near-duplicate topics collapse.
 */
export function mergeCloseClusters(
  points: number[][],
  labels: number[],
  threshold: number
): number[] {
  const out = labels.slice();
  for (;;) {
    const [closest] = clusterSeparations(points, out);
    if (!closest || closest.sep >= threshold) return out;
    out.forEach((l, i) => {
      if (l === closest.b) out[i] = closest.a;
    });
  }
}

/**
 * Split any cluster holding more than `maxFraction` of the points in two
 * (Ward again, inside that cluster), repeating until none is too big.
 */
export function splitOversized(
  points: number[][],
  labels: number[],
  maxFraction: number,
  maxRounds = 4
): number[] {
  const out = labels.slice();
  const limit = points.length * maxFraction;
  let nextId = Math.max(-1, ...labels) + 1;
  for (let round = 0; round < maxRounds; round++) {
    let changed = false;
    for (const idx of groups(out).values()) {
      if (idx.length <= limit || idx.length < 4) continue;
      const halves = wardPartitions(
        idx.map((i) => points[i]),
        2,
        2
      ).get(2);
      if (!halves) continue;
      const newId = nextId++;
      halves.forEach((h, k) => {
        if (h === 1) out[idx[k]] = newId;
      });
      changed = true;
    }
    if (!changed) break;
  }
  return out;
}

export interface WardOptions {
  minClusters: number;
  maxClusters: number;
  // clusters larger than this share of the points are split
  maxFraction: number;
  // clusters closer than this separation are merged (0 = off)
  mergeThreshold: number;
  // posts with a silhouette below this are left unclustered
  noiseSilhouette: number;
  // clusters left smaller than this after noise removal are dropped
  minSize: number;
}

/**
 * Ward clustering with a self-chosen cluster count: take the count in
 * [minClusters, maxClusters] with the best silhouette, split oversized
 * clusters, merge near-duplicates, then mark posts that sit closer to another
 * cluster than their own (negative silhouette) as unclustered noise.
 */
export function wardClustering(
  points: number[][],
  options: WardOptions
): number[] {
  const parts = wardPartitions(
    points,
    options.minClusters,
    options.maxClusters
  );
  let best: number[] | null = null;
  let bestScore = -Infinity;
  for (const labels of parts.values()) {
    const score = silhouetteScore(points, labels);
    if (score > bestScore) {
      bestScore = score;
      best = labels;
    }
  }
  if (!best) return points.map(() => -1);

  let labels = splitOversized(points, best, options.maxFraction);
  if (options.mergeThreshold > 0) {
    labels = mergeCloseClusters(points, labels, options.mergeThreshold);
  }
  const sil = pointSilhouettes(points, labels);
  labels = labels.map((l, i) => (sil[i] < options.noiseSilhouette ? -1 : l));
  for (const idx of groups(labels).values()) {
    if (idx.length < options.minSize) idx.forEach((i) => (labels[i] = -1));
  }
  return labels;
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
