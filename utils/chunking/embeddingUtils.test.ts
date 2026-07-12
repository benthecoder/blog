import { describe, expect, it } from "vitest";
import { formatEmbeddingForPostgres, parseEmbedding } from "./embeddingUtils";

describe("embedding round-trip", () => {
  it("formats for postgres and parses back", () => {
    const vec = [0.1, -0.2, 3];
    expect(parseEmbedding(formatEmbeddingForPostgres(vec))).toEqual(vec);
  });

  it("passes arrays through and parses JSON strings", () => {
    expect(parseEmbedding([1, 2])).toEqual([1, 2]);
    expect(parseEmbedding("[1,2]")).toEqual([1, 2]);
  });

  it("returns [] for garbage", () => {
    expect(parseEmbedding(null)).toEqual([]);
    expect(parseEmbedding(42)).toEqual([]);
  });
});
