// Muted categorical hues, ordered so neighbours in the list look different.
// Light tones hold ~3:1 against paper, dark tones against night.
export const CLUSTER_COLORS_LIGHT = [
  "#b5533a",
  "#3f6d99",
  "#6f8a2c",
  "#8a5aae",
  "#c07a1c",
  "#2c8a86",
  "#b8497f",
  "#4a56b0",
  "#3e8f58",
  "#8a6a4a",
  "#c2493f",
  "#5f7685",
];

export const CLUSTER_COLORS_DARK = [
  "#e0795f",
  "#7aaede",
  "#a9c25a",
  "#b78be0",
  "#e3a64f",
  "#5cc2bc",
  "#e283b3",
  "#8f9ae6",
  "#68c485",
  "#c4a27c",
  "#ea7a70",
  "#9db1bf",
];

export interface ClusterAnchor {
  id: number;
  x: number;
  y: number;
  count: number;
}

/**
 * Give each cluster a palette slot so clusters sharing a slot are as far
 * apart on the map as possible. Biggest clusters pick first.
 */
export function assignClusterColors(
  clusters: ClusterAnchor[],
  slots: number
): Map<number, number> {
  const assigned = new Map<number, number>();
  const order = [...clusters].sort((a, b) => b.count - a.count || a.id - b.id);
  const placed: (ClusterAnchor & { slot: number })[] = [];

  for (const c of order) {
    let bestSlot = 0;
    let bestScore = Infinity;
    for (let slot = 0; slot < slots; slot++) {
      let conflict = 0;
      for (const p of placed) {
        if (p.slot !== slot) continue;
        const d2 = (c.x - p.x) ** 2 + (c.y - p.y) ** 2;
        conflict += 1 / (d2 + 1);
      }
      // ties go to the less-used slot, then the lower index
      const used = placed.filter((p) => p.slot === slot).length;
      const score = conflict + used * 1e-9;
      if (score < bestScore) {
        bestScore = score;
        bestSlot = slot;
      }
    }
    assigned.set(c.id, bestSlot);
    placed.push({ ...c, slot: bestSlot });
  }
  return assigned;
}

/** The post nearest to every other post in its cluster (cluster medoid). */
export function medoid(points: { x: number; y: number }[]): {
  x: number;
  y: number;
} {
  let best = points[0];
  let bestSum = Infinity;
  for (const p of points) {
    let sum = 0;
    for (const q of points) sum += Math.hypot(p.x - q.x, p.y - q.y);
    if (sum < bestSum) {
      bestSum = sum;
      best = p;
    }
  }
  return { x: best.x, y: best.y };
}
