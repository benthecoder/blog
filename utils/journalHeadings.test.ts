import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import MarkdownContent from "@/components/posts/MarkdownContent";
import { readMarkdownFile } from "@/utils/content/markdown";
import { postFrontmatterSchema } from "@/utils/content/schemas";
import { getPostPath } from "@/config/paths";

it("gives repeated journal sections distinct targets and matching heading links", () => {
  const render = (slug: string) =>
    renderToStaticMarkup(
      createElement(MarkdownContent, {
        content: "## ingredients\n\n### steps",
        anchors: true,
        headingPrefix: `journal-${slug}-`,
      })
    );
  const first = render("191125");
  const second = render("171125");
  for (const [html, slug] of [
    [first, "191125"],
    [second, "171125"],
  ]) {
    for (const heading of ["ingredients", "steps"]) {
      expect(html).toContain(`id="journal-${slug}-${heading}"`);
      expect(html).toContain(`href="#journal-${slug}-${heading}"`);
    }
  }
});

it("keeps existing section targets on standalone posts", () => {
  const html = renderToStaticMarkup(
    createElement(MarkdownContent, { content: "## ingredients", anchors: true })
  );
  expect(html).toContain('id="ingredients"');
  expect(html).toContain('href="#ingredients"');
});

it("renders the two affected recipe entries without duplicate section IDs", () => {
  const html = ["191125", "171125"]
    .map((slug) =>
      renderToStaticMarkup(
        createElement(MarkdownContent, {
          content: readMarkdownFile(getPostPath(slug), postFrontmatterSchema)
            .content,
          headingPrefix: `journal-${slug}-`,
          prioritizeFirstImage: false,
        })
      )
    )
    .join("");
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  expect(ids).toContain("journal-191125-ingredients");
  expect(ids).toContain("journal-171125-ingredients");
  expect(new Set(ids).size).toBe(ids.length);
});
