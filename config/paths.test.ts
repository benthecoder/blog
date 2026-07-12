import { describe, expect, it } from "vitest";
import { isSafeSlug } from "./paths";

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
});
