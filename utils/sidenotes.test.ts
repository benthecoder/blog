import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("fs", () => ({
  default: {
    existsSync: () => true,
    readFileSync: () => JSON.stringify({}),
  },
}));
vi.mock("@/utils/content/posts", () => ({
  getPostContent: vi.fn(),
  getPostMetadata: () => [],
}));

import MarkdownContent from "@/components/posts/MarkdownContent";

const render = (content: string) =>
  renderToStaticMarkup(createElement(MarkdownContent, { content }));

describe("sidenotes", () => {
  it("clones a footnote into a margin aside after its paragraph and keeps the endnotes", () => {
    const html = render(
      [
        "More and more, art is made without intention.[^1] In parallel, models improve.",
        "",
        "A second paragraph follows.",
        "",
        "[^1]: Whether this holds depends on your notion of intention.",
      ].join("\n")
    );
    // The aside exists, numbered, with the note's text.
    expect(html).toContain('<aside class="sidenote" aria-hidden="true">');
    expect(html).toContain('<span class="sidenote-number">1</span>');
    expect(html).toContain("depends on your notion of intention");
    // It sits after the paragraph that holds the reference, before the next.
    const anchor = html.indexOf("More and more, art is made");
    const aside = html.indexOf('<aside class="sidenote" aria-hidden="true">');
    const second = html.indexOf("A second paragraph follows.");
    expect(aside).toBeGreaterThan(anchor);
    expect(aside).toBeLessThan(second);
    // The endnotes section stays (small screens render it) and is tagged
    // so wide screens can hide it in favour of the margin copies.
    expect(html).toContain("data-footnotes");
    expect(html).toContain("has-sidenotes");
    // No backref arrow leaks into the margin copy.
    const asideHtml = html.slice(aside, html.indexOf("</aside>"));
    expect(asideHtml).not.toContain("data-footnote-backref");
  });

  it("carries images inside a note into the aside", () => {
    const html = render(
      [
        "The painting in question.[^pic] It was claimed to be AI-made.",
        "",
        "[^pic]: ![the painting](/images/painting.jpg) the monet in question",
      ].join("\n")
    );
    const aside = html.indexOf('<aside class="sidenote" aria-hidden="true">');
    expect(aside).toBeGreaterThanOrEqual(0);
    const asideHtml = html.slice(aside, html.indexOf("</aside>"));
    expect(asideHtml).toContain('src="/images/painting.jpg"');
    expect(asideHtml).toContain("the monet in question");
  });

  it("stacks two notes from one paragraph in order", () => {
    const html = render(
      [
        "First claim.[^a] Second claim.[^b] Same paragraph.",
        "",
        "[^a]: the first note",
        "[^b]: the second note",
      ].join("\n")
    );
    const asides = html.match(/<aside class="sidenote"/g) ?? [];
    expect(asides).toHaveLength(2);
    const first = html.indexOf("the first note");
    const second = html.indexOf("the second note");
    const paragraphEnd = html.indexOf("Same paragraph.");
    expect(first).toBeGreaterThan(paragraphEnd);
    expect(second).toBeGreaterThan(first);
    expect(html).toContain('<span class="sidenote-number">2</span>');
  });

  it("places one aside when a note is referenced twice", () => {
    const html = render(
      [
        "Mentioned here.[^x] And again here.[^x]",
        "",
        "[^x]: the shared note",
      ].join("\n")
    );
    const asides = html.match(/<aside class="sidenote"/g) ?? [];
    expect(asides).toHaveLength(1);
  });

  it("leaves posts without footnotes untouched", () => {
    const html = render("Just a paragraph, no notes at all.");
    expect(html).not.toContain("sidenote");
    expect(html).not.toContain("data-footnotes");
  });
});
