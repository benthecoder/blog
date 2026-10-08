import { describe, expect, it } from "vitest";
import { validateSearchResults } from "./searchResults";
describe("search response validation", () => {
  it.each([null, "{", "null", {}, [null], [{ content: 1 }]])(
    "rejects invalid search results %j",
    (data) => {
      expect(validateSearchResults(data)).toBeNull();
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
    expect(validateSearchResults([result])).toEqual([result]);
    expect(validateSearchResults([{ ...result, section: {} }])).toBeNull();
  });
});
