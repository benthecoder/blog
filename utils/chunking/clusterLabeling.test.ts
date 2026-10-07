import { describe, expect, it } from "vitest";
import { matchPreviousLabels } from "./clusterLabeling";

describe("matchPreviousLabels", () => {
  const previous = [
    { label: "food and meals", slugs: ["a", "b", "c", "d"] },
    { label: "travel", slugs: ["e", "f", "g", "h"] },
    { label: "Cluster 2", slugs: ["i", "j", "k"] },
  ];

  it("follows membership when cluster ids reshuffle", () => {
    const clusters = new Map([
      [0, ["e", "f", "g", "h"]],
      [1, ["a", "b", "c", "d", "z"]], // gained a new post
    ]);
    const labels = matchPreviousLabels(clusters, previous);
    expect(labels.get(0)).toBe("travel");
    expect(labels.get(1)).toBe("food and meals");
  });

  it("leaves clusters below the overlap threshold unlabeled", () => {
    const clusters = new Map([[0, ["a", "e", "x", "y"]]]);
    expect(matchPreviousLabels(clusters, previous).size).toBe(0);
  });

  it("uses each previous label once, best match first", () => {
    const clusters = new Map([
      [0, ["a", "b", "c"]],
      [1, ["a", "b", "c", "d"]],
    ]);
    const labels = matchPreviousLabels(clusters, previous);
    expect(labels.get(1)).toBe("food and meals");
    expect(labels.has(0)).toBe(false);
  });

  it("never reuses fallback labels", () => {
    const clusters = new Map([[0, ["i", "j", "k"]]]);
    expect(matchPreviousLabels(clusters, previous).size).toBe(0);
  });
});
