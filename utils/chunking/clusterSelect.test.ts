import { describe, expect, it } from "vitest";
import { hdbscan } from "./hdbscan";
import {
  absorbNoise,
  renumberBySize,
  selectClustering,
  silhouetteScore,
  splitOversized,
} from "./clusterSelect";

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

describe("hdbscan", () => {
  it("finds well separated groups and marks far outliers as noise", () => {
    const points = [...blobs(centers, 20), [50, 50]];
    const labels = hdbscan(points, { minClusterSize: 8 });
    expect(new Set(labels.filter((l) => l !== -1)).size).toBe(3);
    expect(labels[points.length - 1]).toBe(-1);
    // each blob maps to a single label
    for (let b = 0; b < 3; b++) {
      expect(new Set(labels.slice(b * 20, b * 20 + 20)).size).toBe(1);
    }
  });

  it("returns all noise when there are too few points", () => {
    expect(hdbscan([[0], [1], [2]], { minClusterSize: 5 })).toEqual([
      -1, -1, -1,
    ]);
  });
});

describe("silhouetteScore", () => {
  it("is high for separated clusters and ignores noise", () => {
    const points = blobs(centers, 10);
    const labels = points.map((_, i) => Math.floor(i / 10));
    expect(silhouetteScore(points, labels)).toBeGreaterThan(0.9);
    const withNoise = labels.map((l, i) => (i % 5 === 0 ? -1 : l));
    expect(silhouetteScore(points, withNoise)).toBeGreaterThan(0.9);
  });

  it("is 0 with fewer than two clusters", () => {
    expect(silhouetteScore([[0], [1]], [0, 0])).toBe(0);
  });
});

describe("selectClustering", () => {
  it("picks a run inside the allowed cluster count", () => {
    const points = blobs(centers, 20);
    const result = selectClustering(points, {
      minClusterSizes: [5, 8, 12],
      minClusters: 2,
      maxClusters: 5,
      maxNoiseFraction: 0.5,
      maxFraction: 0.9,
    });
    expect(result.numClusters).toBe(3);
    expect(result.labels).toHaveLength(60);
  });
});

describe("splitOversized", () => {
  it("splits a cluster that holds most points", () => {
    const points = blobs(
      [
        [0, 0],
        [20, 0],
      ],
      20
    );
    const labels = points.map(() => 0);
    const out = splitOversized(points, labels, 8, 0.6);
    expect(new Set(out).size).toBe(2);
  });

  it("leaves small clusters alone", () => {
    const points = blobs(centers, 10);
    const labels = points.map((_, i) => Math.floor(i / 10));
    expect(splitOversized(points, labels, 5, 0.5)).toEqual(labels);
  });
});

describe("absorbNoise", () => {
  it("assigns a stray point sitting inside a cluster but not a far one", () => {
    const points = [...blobs([[0, 0]], 15, 1), [0.05, 0.05], [30, 30]];
    const labels = [...Array.from({ length: 15 }, () => 0), -1, -1];
    const out = absorbNoise(points, labels);
    expect(out[15]).toBe(0);
    expect(out[16]).toBe(-1);
  });
});

describe("renumberBySize", () => {
  it("orders clusters by descending size and keeps noise", () => {
    expect(renumberBySize([5, 5, 2, -1, 5, 2, 9])).toEqual([
      0, 0, 1, -1, 0, 1, 2,
    ]);
  });
});
