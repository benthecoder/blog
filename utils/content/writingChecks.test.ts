import { describe, expect, it } from "vitest";
import { checkWriting } from "./writingChecks";
import type { LinkableEntry } from "@/types/links";

const entries: LinkableEntry[] = [
  {
    ref: { kind: "wiki", slug: "attention" },
    title: "Attention",
    href: "/wiki/attention",
  },
  {
    ref: { kind: "post", slug: "jazz" },
    title: "Jazz practice",
    href: "/posts/jazz",
  },
];
describe("writing checks", () => {
  it("uses the site's title and slug resolver", () => {
    expect(checkWriting("[[ attention ]] [[JAZZ|practice]]", entries)).toEqual(
      []
    );
  });
  it("reports missing pages without treating labels as targets", () => {
    expect(checkWriting("## Notes\n\n[[Missing|Attention]]", entries)).toEqual([
      {
        kind: "missing-wiki",
        line: 3,
        label: "Wiki page not found: Missing",
        target: "Missing",
      },
    ]);
  });
  it("ignores examples in fenced/indented code, inline code, and comments", () => {
    expect(
      checkWriting(
        "`[[Missing]]`\n\n```md\n[[Missing]]\n## Repeat\n## Repeat\n```\n\n    [[Missing]]\n\n<!-- [[Missing]] -->",
        entries
      )
    ).toEqual([]);
  });
  it("normalizes formatted headings while retaining the repeated occurrence's line", () => {
    expect(
      checkWriting("## **Method**\n\n## method\n\n## Other", entries)
    ).toEqual([
      { kind: "repeated-heading", line: 3, label: "Repeated heading: method" },
    ]);
  });
  it("supports setext headings and quoted sections", () => {
    expect(
      checkWriting("Method\n------\n\n> ## Method", entries)[0]
    ).toMatchObject({ kind: "repeated-heading", line: 4 });
  });
  it("checks known local routes, including query strings and reference links", () => {
    expect(
      checkWriting(
        "[Known](/wiki/attention?x=1#method) [Post](/posts/jazz/) [Missing][ref]\n\n[ref]: /wiki/absent",
        entries
      )
    ).toEqual([
      { kind: "missing-page", line: 1, label: "Page not found: /wiki/absent" },
    ]);
  });
  it("decodes local slugs and handles malformed encodings", () => {
    expect(
      checkWriting("[Known](/wiki/%61ttention) [Bad](/posts/%zz)", entries)
    ).toEqual([
      { kind: "missing-page", line: 1, label: "Invalid page link: /posts/%zz" },
    ]);
  });
  it("uses the first reference definition, like Markdown rendering", () => {
    expect(
      checkWriting(
        "[Known][ref]\n\n[ref]: /wiki/attention\n[ref]: /wiki/missing",
        entries
      )
    ).toEqual([]);
  });
  it("compares rendered wikilink labels in headings", () => {
    expect(
      checkWriting("## [[Attention|Method]]\n\n## Method", entries)
    ).toEqual([
      { kind: "repeated-heading", line: 3, label: "Repeated heading: Method" },
    ]);
  });
  it("does not claim to check external links, anchors, or unrelated routes", () => {
    expect(
      checkWriting(
        "[External](https://example.com) [Anchor](#method) [Page](/about) ![image](/images/photo.jpg)",
        entries
      )
    ).toEqual([]);
  });
});
