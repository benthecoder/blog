export interface HdbscanOptions {
  minClusterSize: number;
  // neighbours used for the core distance; defaults to minClusterSize
  minSamples?: number;
  // "eom" favours a few broad groups, "leaf" the finest stable ones
  selection?: "eom" | "leaf";
}

function dist(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) ** 2;
  return Math.sqrt(s);
}

interface CondensedCluster {
  birth: number;
  children: number[];
  points: number[];
  childBirthSize: number;
  size: number;
  stability: number;
}

/**
 * HDBSCAN with excess-of-mass selection. O(n^2) — fine for a few thousand
 * points. Returns one label per point, -1 for noise, clusters numbered from 0.
 */
export function hdbscan(
  points: number[][],
  {
    minClusterSize,
    minSamples = minClusterSize,
    selection = "eom",
  }: HdbscanOptions
): number[] {
  const n = points.length;
  if (n === 0) return [];
  if (n < minClusterSize * 2) return Array.from({ length: n }, () => -1);

  const d: Float64Array[] = points.map(() => new Float64Array(n));
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const v = dist(points[i], points[j]);
      d[i][j] = v;
      d[j][i] = v;
    }
  }

  const k = Math.min(minSamples, n - 1);
  const core = d.map((row) => {
    const sorted = Array.from(row).sort((a, b) => a - b);
    return sorted[k]; // sorted[0] is the point itself
  });
  const mreach = (i: number, j: number) => Math.max(core[i], core[j], d[i][j]);

  // Prim's MST over mutual reachability
  const inTree = new Uint8Array(n);
  const best = new Float64Array(n).fill(Infinity);
  const from = new Int32Array(n).fill(-1);
  const edges: { a: number; b: number; w: number }[] = [];
  let cur = 0;
  inTree[0] = 1;
  for (let step = 1; step < n; step++) {
    let next = -1;
    let nextW = Infinity;
    for (let j = 0; j < n; j++) {
      if (inTree[j]) continue;
      const w = mreach(cur, j);
      if (w < best[j]) {
        best[j] = w;
        from[j] = cur;
      }
      if (best[j] < nextW) {
        nextW = best[j];
        next = j;
      }
    }
    edges.push({ a: from[next], b: next, w: nextW });
    inTree[next] = 1;
    cur = next;
  }
  edges.sort((x, y) => x.w - y.w);

  // Single-linkage dendrogram: leaves 0..n-1, internal nodes n..2n-2
  const parent = Array.from({ length: 2 * n - 1 }, (_, i) => i);
  const find = (x: number): number => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  };
  const left = new Int32Array(n - 1);
  const right = new Int32Array(n - 1);
  const height = new Float64Array(n - 1);
  const size = new Int32Array(2 * n - 1).fill(1);
  edges.forEach((e, idx) => {
    const ra = find(e.a);
    const rb = find(e.b);
    const node = n + idx;
    left[idx] = ra;
    right[idx] = rb;
    height[idx] = e.w;
    size[node] = size[ra] + size[rb];
    parent[ra] = node;
    parent[rb] = node;
  });

  const lambdaOf = (h: number) => 1 / Math.max(h, 1e-9);
  const leavesOf = (root: number): number[] => {
    const out: number[] = [];
    const stack = [root];
    while (stack.length) {
      const node = stack.pop()!;
      if (node < n) out.push(node);
      else stack.push(left[node - n], right[node - n]);
    }
    return out;
  };

  // Condense the tree: only splits into two clusters >= minClusterSize count
  const clusters: CondensedCluster[] = [];
  const fell: { cluster: number; point: number; lambda: number }[] = [];
  const newCluster = (birth: number, sz: number) => {
    clusters.push({
      birth,
      children: [],
      points: [],
      childBirthSize: 0,
      size: sz,
      stability: 0,
    });
    return clusters.length - 1;
  };
  const root = newCluster(0, n);
  const stack: { node: number; cluster: number }[] = [
    { node: 2 * n - 2, cluster: root },
  ];
  while (stack.length) {
    const { node, cluster } = stack.pop()!;
    if (node < n) {
      // a single point reached through a chain of one-sided drops
      fell.push({ cluster, point: node, lambda: clusters[cluster].birth });
      continue;
    }
    const l = left[node - n];
    const r = right[node - n];
    const lambda = lambdaOf(height[node - n]);
    const bigL = size[l] >= minClusterSize;
    const bigR = size[r] >= minClusterSize;
    if (bigL && bigR) {
      for (const child of [l, r]) {
        const c = newCluster(lambda, size[child]);
        clusters[cluster].children.push(c);
        clusters[cluster].childBirthSize += size[child];
        stack.push({ node: child, cluster: c });
      }
    } else if (!bigL && !bigR) {
      for (const p of [...leavesOf(l), ...leavesOf(r)]) {
        fell.push({ cluster, point: p, lambda });
      }
    } else {
      const [small, big] = bigL ? [r, l] : [l, r];
      for (const p of leavesOf(small)) fell.push({ cluster, point: p, lambda });
      stack.push({ node: big, cluster });
    }
  }

  for (const f of fell) {
    clusters[f.cluster].points.push(f.point);
    clusters[f.cluster].stability += f.lambda - clusters[f.cluster].birth;
  }
  clusters.forEach((c) => {
    for (const child of c.children) {
      c.stability += (clusters[child].birth - c.birth) * clusters[child].size;
    }
  });

  // Excess of mass: children are created after parents, so walk backwards
  const best_ = new Float64Array(clusters.length);
  const selected: boolean[] = Array.from(
    { length: clusters.length },
    () => false
  );
  for (let i = clusters.length - 1; i >= 0; i--) {
    const c = clusters[i];
    const childSum = c.children.reduce((s, ch) => s + best_[ch], 0);
    const takeSelf =
      c.children.length === 0 ||
      (selection === "eom" && c.stability >= childSum);
    if (i !== root && takeSelf) {
      best_[i] = c.stability;
      selected[i] = true;
      // deselect descendants
      const q = [...c.children];
      while (q.length) {
        const ch = q.pop()!;
        selected[ch] = false;
        q.push(...clusters[ch].children);
      }
    } else {
      best_[i] = childSum;
    }
  }

  const labels = Array.from({ length: n }, () => -1);
  let next = 0;
  clusters.forEach((_, i) => {
    if (!selected[i]) return;
    const q = [i];
    while (q.length) {
      const ci = q.pop()!;
      for (const p of clusters[ci].points) labels[p] = next;
      q.push(...clusters[ci].children);
    }
    next++;
  });
  return labels;
}
