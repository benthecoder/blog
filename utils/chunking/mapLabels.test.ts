import { describe, expect, it } from "vitest";
import { buildDensityGrid, fitCluster, placeLabels } from "./mapLabels";
import { assignClusterColors, medoid } from "./mapPalette";

const bounds = { width: 400, height: 300 };

describe("placeLabels", () => {
  it("drops a label that would collide instead of overlapping", () => {
    const placed = placeLabels(
      [
        { id: 1, x: 200, y: 150, w: 80, h: 14, weight: 50 },
        { id: 2, x: 200, y: 150, w: 80, h: 14, weight: 10 },
      ],
      () => 0,
      bounds
    );
    const a = placed.find((p) => p.id === 1)!;
    const b = placed.find((p) => p.id === 2);
    expect(a).toBeDefined();
    if (b) {
      const overlap = a.x1 < b.x2 && a.x2 > b.x1 && a.y1 < b.y2 && a.y2 > b.y1;
      expect(overlap).toBe(false);
    }
  });

  it("moves off a dense patch of points when a sparse spot is nearby", () => {
    const dense = Array.from({ length: 40 }, (_, i) => ({
      x: 190 + (i % 8) * 3,
      y: 145 + Math.floor(i / 8) * 3,
    }));
    const [label] = placeLabels(
      [{ id: 1, x: 210, y: 150, w: 60, h: 12, weight: 1 }],
      buildDensityGrid(dense),
      bounds
    );
    const onTop = buildDensityGrid(dense)({ ...label });
    expect(onTop).toBeLessThan(40);
    expect(label.y1 !== 150 - 6 || label.x1 !== 210 - 30).toBe(true);
  });

  it("keeps labels inside the viewport", () => {
    const [label] = placeLabels(
      [{ id: 1, x: 2, y: 2, w: 80, h: 14, weight: 1 }],
      () => 0,
      bounds
    );
    expect(label.x1).toBeGreaterThanOrEqual(0);
    expect(label.y1).toBeGreaterThanOrEqual(0);
  });
});

describe("fitCluster", () => {
  it("centers the cluster and zooms in", () => {
    const points = [
      { x: 100, y: 100 },
      { x: 200, y: 200 },
      { x: 150, y: 150 },
    ];
    const t = fitCluster(points, { width: 1000, height: 1000 });
    expect(t.k).toBeGreaterThan(1);
    // the cluster centre lands in the middle of the viewport
    expect(150 * t.k + t.x).toBeCloseTo(500, 0);
    expect(150 * t.k + t.y).toBeCloseTo(500, 0);
  });
});

describe("assignClusterColors", () => {
  it("spreads a repeated slot across distant clusters", () => {
    const clusters = [
      { id: 0, x: 0, y: 0, count: 10 },
      { id: 1, x: 10, y: 0, count: 9 },
      { id: 2, x: 1000, y: 1000, count: 8 },
    ];
    const slots = assignClusterColors(clusters, 2);
    expect(slots.get(0)).not.toBe(slots.get(1));
    // cluster 2 reuses a slot, with the far-away cluster rather than the near one
    expect(slots.get(2)).toBe(slots.get(0));
  });
});

describe("medoid", () => {
  it("picks the most central point", () => {
    expect(
      medoid([
        { x: 0, y: 0 },
        { x: 5, y: 0 },
        { x: 6, y: 0 },
        { x: 100, y: 0 },
      ])
    ).toEqual({ x: 5, y: 0 });
  });
});
