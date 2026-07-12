import { describe, expect, it } from "vitest";
import { countTagFrequency, parseTags } from "./tags";
import type { PostMetadata } from "@/types/post";

describe("parseTags", () => {
  it("passes arrays through", () => {
    expect(parseTags(["a", "b"])).toEqual(["a", "b"]);
  });

  it("splits comma-separated strings and trims", () => {
    expect(parseTags("a, b ,c")).toEqual(["a", "b", "c"]);
  });

  it("returns [] for missing or unknown shapes", () => {
    expect(parseTags(undefined)).toEqual([]);
    expect(parseTags(null)).toEqual([]);
    expect(parseTags(42)).toEqual([]);
  });
});

describe("countTagFrequency", () => {
  const post = (tags: string[]) => ({ tags }) as PostMetadata;

  it("counts and sorts descending", () => {
    const result = countTagFrequency([
      post(["ml", "life"]),
      post(["ml"]),
      post(["ml", "books"]),
    ]);
    expect(result[0]).toEqual(["ml", 3]);
    expect(result).toHaveLength(3);
  });

  it("skips excluded and empty tags", () => {
    const result = countTagFrequency([post(["ml", "", "life"])], ["life"]);
    expect(result).toEqual([["ml", 1]]);
  });
});
