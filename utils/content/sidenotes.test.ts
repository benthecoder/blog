import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { Parser } from "htmlparser2";
import type { LinkableEntry } from "@/types/links";

vi.mock("@/utils/content/links", () => ({
  getLinkIndex: () => ({
    resolve: () => ({ href: "/wiki/the-note" }),
  }),
}));
vi.mock("@/utils/content/preview", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./preview")>();
  return {
    ...actual,
    getPostPreviewData: (slug: string) => ({
      slug,
      title: "Example post",
      date: "2026-01-01",
      excerpt: "An example.",
    }),
  };
});
import MarkdownContent from "@/components/posts/MarkdownContent";
import MarkdownPreview from "@/components/posts/MarkdownPreview";

const entries: LinkableEntry[] = [
  {
    ref: { kind: "wiki", slug: "the-note" },
    title: "The note",
    href: "/wiki/the-note",
  },
];

for (const renderer of ["published", "preview"] as const) {
  describe(`${renderer} footnotes`, () => {
    it.each([
      ["ordinary", "[the reference](/about)", "/about"],
      ["post", "[the reference](/posts/example)", "/posts/example"],
      ["wiki", "[[The note|the reference]]", "/wiki/the-note"],
    ])(
      "keeps only the canonical %s link in the tab order",
      (_kind, link, href) => {
        const content = `A note.[^detail]\n\n[^detail]: Read ${link}.`;
        const html = renderToStaticMarkup(
          renderer === "published"
            ? createElement(MarkdownContent, { content })
            : createElement(MarkdownPreview, { content, linkEntries: entries })
        );
        let inSidenote = false;
        let backrefs = 0;
        const links: { sidenote: boolean; tabIndex?: string }[] = [];
        const parser = new Parser({
          onopentag(name, attributes) {
            if (name === "aside") inSidenote = true;
            if (name === "a" && "data-footnote-backref" in attributes)
              backrefs++;
            if (name === "a" && attributes.href === href) {
              links.push({
                sidenote: inSidenote,
                tabIndex: attributes.tabindex,
              });
            }
          },
          onclosetag(name) {
            if (name === "aside") inSidenote = false;
          },
        });
        parser.end(html);
        expect(links).toEqual([
          { sidenote: true, tabIndex: "-1" },
          { sidenote: false, tabIndex: undefined },
        ]);
        expect(backrefs).toBe(1);
        expect(html).toContain('id="user-content-fnref-detail"');
      }
    );
  });
}
