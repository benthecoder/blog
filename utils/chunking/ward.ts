/**
 * Ward's agglomerative clustering (minimum variance merges). Unlike
 * density-based methods it still gives balanced groups when topics blend into
 * a continuum, which is what idea summaries look like.
 *
 * Returns the partition at every cluster count from `kMax` down to `kMin`
 * (labels 0..k-1). O(n^3) in the worst case, fine for a few thousand posts.
 */
export function wardPartitions(
  points: number[][],
  kMin: number,
  kMax: number
): Map<number, number[]> {
  const n = points.length;
  const out = new Map<number, number[]>();
  if (n === 0) return out;
  const dim = points[0].length;
  const size = Array.from({ length: n }, () => 1);
  const center = points.map((p) => p.slice());
  const members: number[][] = points.map((_, i) => [i]);
  const active: number[] = Array.from({ length: n }, (_, i) => i);

  const cost = (a: number, b: number) => {
    let s = 0;
    for (let k = 0; k < dim; k++) s += (center[a][k] - center[b][k]) ** 2;
    return ((size[a] * size[b]) / (size[a] + size[b])) * s;
  };
  const snapshot = () => {
    const labels = Array.from({ length: n }, () => 0);
    active.forEach((c, ci) => members[c].forEach((m) => (labels[m] = ci)));
    out.set(active.length, labels);
  };

  if (active.length <= kMax) snapshot();
  while (active.length > Math.max(kMin, 1)) {
    let best = Infinity;
    let bi = 0;
    let bj = 1;
    for (let i = 0; i < active.length; i++) {
      for (let j = i + 1; j < active.length; j++) {
        const c = cost(active[i], active[j]);
        if (c < best) {
          best = c;
          bi = i;
          bj = j;
        }
      }
    }
    const a = active[bi];
    const b = active[bj];
    for (let k = 0; k < dim; k++) {
      center[a][k] =
        (center[a][k] * size[a] + center[b][k] * size[b]) / (size[a] + size[b]);
    }
    size[a] += size[b];
    members[a].push(...members[b]);
    active.splice(bj, 1);
    if (active.length <= kMax) snapshot();
  }
  return out;
}

/** Per-point silhouette (-1..1) against the given labels; 0 for singletons. */
export function pointSilhouettes(
  points: number[][],
  labels: number[]
): number[] {
  const ids = Array.from(new Set(labels));
  const members = new Map<number, number[]>(ids.map((id) => [id, []]));
  labels.forEach((l, i) => members.get(l)!.push(i));
  const dist = (a: number[], b: number[]) => {
    let s = 0;
    for (let k = 0; k < a.length; k++) s += (a[k] - b[k]) ** 2;
    return Math.sqrt(s);
  };
  return points.map((p, i) => {
    const own = members.get(labels[i])!;
    if (own.length < 2 || ids.length < 2) return 0;
    let a = 0;
    for (const j of own) if (j !== i) a += dist(p, points[j]);
    a /= own.length - 1;
    let b = Infinity;
    for (const id of ids) {
      if (id === labels[i]) continue;
      const other = members.get(id)!;
      let s = 0;
      for (const j of other) s += dist(p, points[j]);
      b = Math.min(b, s / other.length);
    }
    return (b - a) / Math.max(a, b);
  });
}
