// Muted categorical hues picked by maximin search: every pair stays at least
// ΔE 12 apart under normal vision and simulated protanopia, deuteranopia and
// tritanopia (see mapPalette.test.ts), with ~3:1 contrast against paper and
// 4.5:1 against night. Order is arbitrary; assignClusterColors spaces repeats.
export const CLUSTER_COLORS_LIGHT = [
  "#7f6339",
  "#3899bc",
  "#2a318d",
  "#86325f",
  "#7c9c3a",
  "#5d63b6",
  "#ad6779",
  "#71397f",
  "#c94a96",
  "#6438bc",
  "#8d2a3e",
  "#ad8767",
];

export const CLUSTER_COLORS_DARK = [
  "#b47489",
  "#9fce5a",
  "#9372d5",
  "#dec4a6",
  "#72c8d5",
  "#ce695a",
  "#7489b4",
  "#a6ded3",
  "#d5a772",
  "#b2a1e3",
  "#dee3a1",
  "#dc8989",
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
