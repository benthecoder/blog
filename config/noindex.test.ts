import { describe, expect, it } from "vitest";
import { isNoindexHtml } from "./noindex";

describe("isNoindexHtml", () => {
  it("detects a robots noindex meta", () => {
    expect(
      isNoindexHtml('<head><meta name="robots" content="noindex, follow"/>')
    ).toBe(true);
  });

  it("ignores indexable pages and unrelated metas", () => {
    expect(isNoindexHtml('<meta name="robots" content="index, follow"/>')).toBe(
      false
    );
    expect(isNoindexHtml('<meta name="description" content="noindex"/>')).toBe(
      false
    );
    expect(isNoindexHtml("<html></html>")).toBe(false);
  });
});
