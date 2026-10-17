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

describe("fotonotes", () => {
  it("moves an image footnote out of the endnotes into a figure after its paragraph", () => {
    const html = render(
      [
        "The trail climbed past the falls.[^falls] The water was loud.",
        "",
        "A second paragraph follows.",
        "",
        "[^falls]: ![the falls](/images/falls.jpg) first snowmelt of the year",
      ].join("\n")
    );
    expect(html).toContain('<figure class="fotonote"');
    expect(html).toContain('src="/images/falls.jpg"');
    expect(html).toContain("first snowmelt of the year");
    // No endnotes section remains when every footnote is a fotonote.
    expect(html).not.toContain("data-footnotes");
    // The figure sits after the paragraph that holds the reference.
    const anchor = html.indexOf("The trail climbed");
    const figure = html.indexOf('<figure class="fotonote"');
    const second = html.indexOf("A second paragraph follows.");
    expect(anchor).toBeGreaterThanOrEqual(0);
    expect(figure).toBeGreaterThan(anchor);
    expect(figure).toBeLessThan(second);
  });

  it("keeps text footnotes as endnotes alongside a fotonote", () => {
    const html = render(
      [
        "Text with a photo.[^pic] And a plain note.[^note]",
        "",
        "[^pic]: ![a bridge](/images/bridge.jpg)",
        "[^note]: a regular text footnote",
      ].join("\n")
    );
    expect(html).toContain('<figure class="fotonote"');
    expect(html).toContain('src="/images/bridge.jpg"');
    expect(html).toContain("data-footnotes");
    expect(html).toContain("a regular text footnote");
    // The photo definition no longer appears inside the endnotes list.
    const section = html.slice(html.indexOf("data-footnotes"));
    expect(section).not.toContain("bridge.jpg");
  });

  it("leaves image-free footnotes completely alone", () => {
    const html = render(
      ["Only a note here.[^one]", "", "[^one]: just words"].join("\n")
    );
    expect(html).not.toContain("fotonote");
    expect(html).toContain("data-footnotes");
    expect(html).toContain("just words");
  });
});
