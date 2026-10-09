import { describe, expect, it } from "vitest";
import {
  clusterSeparations,
  mergeCloseClusters,
  renumberBySize,
  silhouetteScore,
  splitOversized,
  wardClustering,
} from "./clusterSelect";
import { pointSilhouettes, wardPartitions } from "./ward";

// deterministic pseudo-random blobs
function blobs(centers: number[][], perBlob: number, spread = 0.3) {
  let seed = 7;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647 - 0.5;
  };
  return centers.flatMap((c) =>
    Array.from({ length: perBlob }, () => c.map((x) => x + rand() * spread))
  );
}

const centers = [
  [0, 0],
  [10, 0],
  [0, 10],
];

describe("wardPartitions", () => {
  it("recovers well separated groups at the right count", () => {
    const points = blobs(centers, 15);
    const labels = wardPartitions(points, 3, 3).get(3)!;
    for (let b = 0; b < 3; b++) {
      expect(new Set(labels.slice(b * 15, b * 15 + 15)).size).toBe(1);
    }
    expect(new Set(labels).size).toBe(3);
  });

  it("returns every partition in the requested range", () => {
    const parts = wardPartitions(blobs(centers, 10), 2, 5);
    expect([...parts.keys()].sort()).toEqual([2, 3, 4, 5]);
  });
});

describe("silhouettes", () => {
  it("is high for separated clusters, negative for a misassigned point", () => {
    const points = blobs(centers, 10);
    const labels = points.map((_, i) => Math.floor(i / 10));
    expect(silhouetteScore(points, labels)).toBeGreaterThan(0.9);
    const wrong = labels.slice();
    wrong[0] = 1;
    expect(pointSilhouettes(points, wrong)[0]).toBeLessThan(0);
  });

  it("ignores noise and is 0 with fewer than two clusters", () => {
    const points = blobs(centers, 10);
    const labels = points.map((_, i) =>
      i % 5 === 0 ? -1 : Math.floor(i / 10)
    );
    expect(silhouetteScore(points, labels)).toBeGreaterThan(0.9);
    expect(silhouetteScore([[0], [1]], [0, 0])).toBe(0);
  });
});

describe("wardClustering", () => {
  const options = {
    minClusters: 2,
    maxClusters: 6,
    maxFraction: 0.9,
    mergeThreshold: 0.5,
    noiseSilhouette: 0,
    minSize: 3,
  };

  it("picks the natural number of groups", () => {
    const labels = wardClustering(blobs(centers, 15), options);
    expect(new Set(labels.filter((l) => l !== -1)).size).toBe(3);
  });

  it("leaves a point stranded between groups unclustered", () => {
    const points = [...blobs(centers.slice(0, 2), 15), [5, 0.2]];
    const labels = wardClustering(points, { ...options, minClusters: 2 });
    expect(labels[points.length - 1]).toBe(-1);
  });
});

describe("splitOversized", () => {
  it("splits a cluster holding most points and leaves small ones alone", () => {
    const points = blobs(
      [
        [0, 0],
        [20, 0],
      ],
      20
    );
    const one = points.map(() => 0);
    expect(new Set(splitOversized(points, one, 0.6)).size).toBe(2);

    const labels = points.map((_, i) => Math.floor(i / 20));
    expect(splitOversized(points, labels, 0.6)).toEqual(labels);
  });
});

describe("mergeCloseClusters", () => {
  it("merges overlapping clusters but keeps distant ones apart", () => {
    const points = [
      ...blobs([[0, 0]], 10, 1),
      ...blobs([[0.3, 0]], 10, 1),
      ...blobs([[30, 0]], 10, 1),
    ];
    const labels = points.map((_, i) => Math.floor(i / 10));
    const sep = clusterSeparations(points, labels);
    expect(sep[0].sep).toBeLessThan(sep[1].sep);
    const merged = mergeCloseClusters(points, labels, 0.5);
    expect(new Set(merged).size).toBe(2);
    expect(merged[0]).toBe(merged[15]);
    expect(merged[0]).not.toBe(merged[25]);
  });
});

describe("renumberBySize", () => {
  it("orders clusters by descending size and keeps noise", () => {
    expect(renumberBySize([5, 5, 2, -1, 5, 2, 9])).toEqual([
      0, 0, 1, -1, 0, 1, 2,
    ]);
  });
});
