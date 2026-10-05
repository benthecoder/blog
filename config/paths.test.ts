import { describe, expect, it } from "vitest";
import path from "path";
import {
  isSafeSlug,
  getPostPath,
  getDraftPath,
  getWikiPath,
  POSTS_DIR,
  DRAFTS_DIR,
  WIKI_DIR,
} from "./paths";

describe("isSafeSlug", () => {
  it("accepts normal slugs", () => {
    expect(isSafeSlug("yosemite-hike")).toBe(true);
    expect(isSafeSlug("010125")).toBe(true);
    expect(isSafeSlug("yc-23")).toBe(true);
  });

  it("rejects traversal and separators", () => {
    expect(isSafeSlug("../secrets")).toBe(false);
    expect(isSafeSlug("..")).toBe(false);
    expect(isSafeSlug("a/b")).toBe(false);
    expect(isSafeSlug("a\\b")).toBe(false);
    expect(isSafeSlug("a\0b")).toBe(false);
  });

  it.each([null, undefined, 123, true, {}, [], ["../secret"], ""])(
    "rejects non-string JSON values and empty slugs: %j",
    (value) => expect(isSafeSlug(value)).toBe(false)
  );
});

describe("content paths", () => {
  it.each([
    [getPostPath, POSTS_DIR],
    [getDraftPath, DRAFTS_DIR],
    [getWikiPath, WIKI_DIR],
  ] as const)(
    "keeps paths within the content directory",
    (getPath, directory) => {
      expect(getPath("safe-slug")).toBe(path.join(directory, "safe-slug.md"));
      for (const slug of ["../secret", "a/b", "a\\b", "a\0b", ""]) {
        expect(() => getPath(slug)).toThrow("Invalid slug");
      }
      // JSON arrays previously passed includes() checks, then coerced into paths.
      expect(() => getPath(["../secret"] as unknown as string)).toThrow(
        "Invalid slug"
      );
    }
  );
});
