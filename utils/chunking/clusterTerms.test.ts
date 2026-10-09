import { describe, expect, it } from "vitest";
import { distinctiveTerms, nearestToCentroid, tokenize } from "./clusterTerms";

describe("tokenize", () => {
  it("lowercases and drops stopwords and short tokens", () => {
    expect(tokenize("The Climate of it, and a CO2 plan")).toEqual([
      "climate",
      "plan",
    ]);
  });
});

describe("distinctiveTerms", () => {
  const docs = (title: string, body: string) =>
    Array.from({ length: 5 }, () => ({ title, content: body }));

  it("ranks terms unique to a cluster above shared ones", () => {
    const terms = distinctiveTerms(
      new Map([
        [0, docs("solar grid", "solar panels and grid storage notes")],
        [1, docs("sourdough", "bread starter flour notes")],
      ]),
      3
    );
    expect(terms.get(0)![0]).toBe("solar");
    expect(terms.get(0)).not.toContain("notes");
    expect(terms.get(1)).toContain("sourdough");
  });
});

describe("nearestToCentroid", () => {
  it("orders members by distance to their mean", () => {
    const vectors = [[0], [1], [2], [10]];
    expect(nearestToCentroid(vectors, [0, 1, 2])).toEqual([1, 0, 2]);
  });
});
