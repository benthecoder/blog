import { afterEach, describe, expect, it, vi } from "vitest";
import { parseSearchCache } from "./searchCache";
import { readStoredString, writeStoredString } from "./browserStorage";

afterEach(() => vi.unstubAllGlobals());
describe("optional browser caches", () => {
  it.each([null, "{", "null", "{}", "[null]", '[{"content":1}]'])(
    "ignores invalid search cache %j",
    (raw) => {
      expect(parseSearchCache(raw)).toBeNull();
    }
  );
  it("restores valid results and rejects fields that would crash the UI", () => {
    const result = {
      content: "Notes",
      post_slug: "notes",
      post_title: "Notes",
      chunk_type: "full-post",
      score_type: "keyword",
      similarity: 0.8,
      tags: ["writing"],
    };
    expect(parseSearchCache(JSON.stringify([result]))).toEqual([result]);
    expect(
      parseSearchCache(JSON.stringify([{ ...result, section: {} }]))
    ).toBeNull();
  });
  it("works when browser storage access is blocked", () => {
    vi.stubGlobal("window", {
      get sessionStorage() {
        throw new Error("Storage blocked");
      },
    });
    expect(readStoredString("query", "session")).toBeNull();
    expect(writeStoredString("query", "notes", "session")).toBe(false);
  });
});
