export interface Box {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface LabelRequest {
  id: number;
  // anchor (screen px) and size of the label box
  x: number;
  y: number;
  w: number;
  h: number;
  // bigger clusters claim space first
  weight: number;
}

export interface PlacedLabel extends Box {
  id: number;
}

const overlaps = (a: Box, b: Box) =>
  a.x1 < b.x2 && a.x2 > b.x1 && a.y1 < b.y2 && a.y2 > b.y1;

/** Coarse screen-space grid of point counts, to find sparse spots for text. */
export function buildDensityGrid(
  points: { x: number; y: number }[],
  cell = 16
) {
  const counts = new Map<string, number>();
  for (const p of points) {
    const key = `${Math.floor(p.x / cell)},${Math.floor(p.y / cell)}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return (box: Box) => {
    let total = 0;
    for (let cx = Math.floor(box.x1 / cell); cx <= box.x2 / cell; cx++) {
      for (let cy = Math.floor(box.y1 / cell); cy <= box.y2 / cell; cy++) {
        total += counts.get(`${cx},${cy}`) ?? 0;
      }
    }
    return total;
  };
}

/**
 * Place each label near its anchor, trying a few nearby offsets and keeping
 * the one that covers the fewest points without hitting a label already
 * placed or leaving the viewport. A label with no free spot is dropped.
 */
export function placeLabels(
  requests: LabelRequest[],
  density: (box: Box) => number,
  bounds: { width: number; height: number } | null,
  { gap = 3, reserved = [] as Box[] } = {}
): PlacedLabel[] {
  const placed: PlacedLabel[] = [];
  const order = [...requests].sort((a, b) => b.weight - a.weight);

  for (const r of order) {
    const dx = r.w / 2 + gap;
    const dy = r.h + gap;
    const offsets: [number, number][] = [
      [0, 0],
      [0, -dy],
      [0, dy],
      [-dx, 0],
      [dx, 0],
      [-dx, -dy],
      [dx, -dy],
      [-dx, dy],
      [dx, dy],
    ];
    let best: { box: Box; cost: number } | null = null;
    for (const [ox, oy] of offsets) {
      // Without bounds the layout ignores the viewport, so panning (which
      // only translates) can never change where a label lands.
      const cx = bounds
        ? Math.min(Math.max(r.x + ox, r.w / 2 + 2), bounds.width - r.w / 2 - 2)
        : r.x + ox;
      const cy = bounds
        ? Math.min(Math.max(r.y + oy, r.h / 2 + 2), bounds.height - r.h / 2 - 2)
        : r.y + oy;
      const box = {
        x1: cx - r.w / 2,
        y1: cy - r.h / 2,
        x2: cx + r.w / 2,
        y2: cy + r.h / 2,
      };
      if (placed.some((p) => overlaps(box, p))) continue;
      if (reserved.some((p) => overlaps(box, p))) continue;
      // density dominates; distance from the anchor breaks ties
      const cost = density(box) * 10 + Math.abs(ox) + Math.abs(oy);
      if (!best || cost < best.cost) best = { box, cost };
    }
    if (best) placed.push({ id: r.id, ...best.box });
  }
  return placed;
}

/**
 * Zoom transform that frames a cluster. Uses the 5th-95th percentile spread
 * so a few stragglers don't push the zoom out.
 */
export function fitCluster(
  points: { x: number; y: number }[],
  viewport: { width: number; height: number },
  { padding = 60, maxK = 6, minK = 1.2 } = {}
): { k: number; x: number; y: number } {
  const q = (values: number[], p: number) => {
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];
  };
  const sx = viewport.width / 1000;
  const sy = viewport.height / 1000;
  const xs = points.map((p) => p.x * sx);
  const ys = points.map((p) => p.y * sy);
  const x1 = q(xs, 0.05);
  const x2 = q(xs, 0.95);
  const y1 = q(ys, 0.05);
  const y2 = q(ys, 0.95);
  const w = Math.max(x2 - x1, 1);
  const h = Math.max(y2 - y1, 1);
  const k = Math.min(
    maxK,
    Math.max(
      minK,
      Math.min(
        (viewport.width - padding * 2) / w,
        (viewport.height - padding * 2) / h
      )
    )
  );
  return {
    k,
    x: viewport.width / 2 - ((x1 + x2) / 2) * k,
    y: viewport.height / 2 - ((y1 + y2) / 2) * k,
  };
}
