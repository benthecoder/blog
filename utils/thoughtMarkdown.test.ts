import { describe, expect, it } from "vitest";
import {
  bareContentUrls,
  contentHasUrl,
  markdownLinks,
} from "./thoughtMarkdown";

describe("markdownLinks", () => {
  it("marks autolinked and raw URLs as bare, and keeps labeled markdown links", () => {
    const src = `
- a point
- another, see https://example.com/bare

Read [the paper](https://example.com/paper) and <https://example.com/angled>.
`;
    expect(markdownLinks(src)).toEqual([
      { href: "https://example.com/bare", bare: true },
      { href: "https://example.com/paper", bare: false },
      { href: "https://example.com/angled", bare: true },
    ]);
    expect(bareContentUrls(src)).toEqual([
      "https://example.com/bare",
      "https://example.com/angled",
    ]);
    expect(contentHasUrl(src, "https://example.com/paper")).toBe(true);
    expect(contentHasUrl(src, "https://example.com/missing")).toBe(false);
  });
});
