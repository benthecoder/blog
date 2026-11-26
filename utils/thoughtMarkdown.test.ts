import { describe, expect, it } from "vitest";
import {
  bareContentUrls,
  contentHasUrl,
  featuredThoughtLink,
  markdownLinks,
  markdownToPlainText,
  notesWithoutFeaturedLink,
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

describe("featuredThoughtLink", () => {
  const url = "https://example.com/post";

  it("prefers the stored link, then the first bare URL in the body", () => {
    expect(featuredThoughtLink("a note", url)).toBe(url);
    expect(
      featuredThoughtLink("see https://example.com/bare first", null)
    ).toBe("https://example.com/bare");
    expect(featuredThoughtLink("just a note", null)).toBeNull();
  });
});

describe("notesWithoutFeaturedLink", () => {
  const url = "https://www.anthropic.com/research/migrating-api-to-rust";

  it("lifts a bare URL off the end of a list item", () => {
    const content = `- one
- use loops and inject judgement. ${url}`;
    expect(notesWithoutFeaturedLink(content, url)).toBe(
      `- one
- use loops and inject judgement.`
    );
  });

  it("lifts a bare URL or angle autolink on its own line", () => {
    expect(notesWithoutFeaturedLink(`a note\n\n${url}\n\nmore`, url)).toBe(
      "a note\n\nmore"
    );
    expect(notesWithoutFeaturedLink(`a note\n\n<${url}>`, url)).toBe("a note");
  });

  it("leaves a labeled markdown link in the notes", () => {
    const content = `Read [the paper](${url}) today.`;
    expect(notesWithoutFeaturedLink(content, url)).toBe(content);
  });
});

describe("markdownToPlainText", () => {
  it("drops markup and joins lists and paragraphs with spaces", () => {
    expect(
      markdownToPlainText(
        "- a **point**\n- another, see [the paper](https://example.com/paper)"
      )
    ).toBe("a point another, see the paper");
    expect(markdownToPlainText("  hello   world  ")).toBe("hello world");
    expect(markdownToPlainText("")).toBe("");
  });
});
