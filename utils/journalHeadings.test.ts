import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import MarkdownContent from "@/components/posts/MarkdownContent";

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
