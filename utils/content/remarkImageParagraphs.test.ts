import { describe, expect, it } from "vitest";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import remarkImageParagraphs from "./remarkImageParagraphs";
import type { Paragraph, Root } from "mdast";

const render = (markdown: string) =>
  String(
    unified()
      .use(remarkParse)
      .use(remarkImageParagraphs)
      .use(remarkRehype)
      .use(rehypeStringify)
      .processSync(markdown)
  );

describe("image-led paragraphs", () => {
  it("preserves adjacent images and following formatted text", () => {
    expect(
      render(
        "![First](/one.svg)\n![Second](/two.svg)\nKeep **this** and [the link](/posts)."
      )
    ).toBe(
      '<p><img src="/one.svg" alt="First"></p>\n<p><img src="/two.svg" alt="Second"></p>\n<p>\nKeep <strong>this</strong> and <a href="/posts">the link</a>.</p>'
    );
  });

  it("preserves text between images and after the last image", () => {
    expect(render("![One](/one.svg) first ![Two](/two.svg) last")).toBe(
      '<p><img src="/one.svg" alt="One"></p>\n<p> first </p>\n<p><img src="/two.svg" alt="Two"></p>\n<p> last</p>'
    );
  });

  it("keeps ordinary inline-image paragraphs unchanged", () => {
    expect(render("Before ![Inline](/one.svg) after")).toBe(
      '<p>Before <img src="/one.svg" alt="Inline"> after</p>'
    );
  });

  it("preserves reference-style images and their following text", () => {
    expect(render("![Reference][photo] trailing\n\n[photo]: /one.svg")).toBe(
      '<p><img src="/one.svg" alt="Reference"></p>\n<p> trailing</p>'
    );
  });

  it("leaves unresolved image references unchanged", () => {
    const paragraph: Paragraph = {
      type: "paragraph",
      children: [
        {
          type: "imageReference",
          identifier: "missing",
          referenceType: "full",
          alt: "Missing",
        },
        { type: "text", value: " trailing" },
      ],
    };
    const tree: Root = { type: "root", children: [paragraph] };
    remarkImageParagraphs()(tree);
    expect(tree.children).toEqual([paragraph]);
    expect(tree.children[0]).toBe(paragraph);
  });

  it("keeps standalone image paragraphs and their metadata intact", () => {
    const paragraph: Paragraph = {
      type: "paragraph",
      data: { hProperties: { id: "existing" } },
      children: [{ type: "image", url: "/one.svg", alt: "One" }],
    };
    const tree: Root = { type: "root", children: [paragraph] };
    remarkImageParagraphs()(tree);
    expect(tree.children[0]).toBe(paragraph);
    expect(paragraph.data?.hProperties?.id).toBe("existing");
  });

  it("splits images inside blockquotes without empty paragraphs", () => {
    expect(render("> ![One](/one.svg)\n> ![Two](/two.svg)\n> kept")).toBe(
      '<blockquote>\n<p><img src="/one.svg" alt="One"></p>\n<p><img src="/two.svg" alt="Two"></p>\n<p>\nkept</p>\n</blockquote>'
    );
  });
});
