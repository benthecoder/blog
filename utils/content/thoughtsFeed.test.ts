import { describe, expect, it } from "vitest";
import { buildThoughtsFeed } from "./thoughtsFeed";

const thought = (id: number, extra = {}) => ({
  id,
  content: `thought ${id}`,
  created_at: new Date(Date.UTC(2025, 0, 1 + id)).toISOString(),
  ...extra,
});

describe("buildThoughtsFeed", () => {
  it("caps at 30 items and links to anchors", () => {
    const many = Array.from({ length: 40 }, (_, i) => thought(40 - i));
    const xml = buildThoughtsFeed(many);
    expect(xml.match(/<item>/g)).toHaveLength(30);
    expect(xml).toContain(
      '<guid isPermaLink="true">https://bneo.xyz/thoughts#t-40</guid>'
    );
    expect(xml).toContain("<lastBuildDate>");
  });

  it("truncates long titles at a word boundary", () => {
    const xml = buildThoughtsFeed([
      thought(1, { content: "word ".repeat(40) }),
    ]);
    expect(xml).toMatch(/<title><!\[CDATA\[(word ){15}word…\]\]><\/title>/);
  });

  it("falls back to link title when content is empty", () => {
    const xml = buildThoughtsFeed([
      thought(1, { content: "", link: "https://a.dev", link_title: "A page" }),
    ]);
    expect(xml).toContain("<title><![CDATA[A page]]></title>");
    expect(xml).toContain('<a href="https://a.dev">A page</a>');
  });

  it("escapes ]]> and script in content", () => {
    const xml = buildThoughtsFeed([
      thought(1, { content: "a ]]> <script>x</script>\nnext" }),
    ]);
    const description = xml.split("<description>")[2];
    expect(description).not.toContain("<script>");
    expect(description).toContain("]]&gt;");
    expect(xml).toContain("]]]]><![CDATA[>");
    expect(xml).toContain("&lt;script&gt;x&lt;/script&gt;<br>next");
  });

  it("builds an empty channel", () => {
    const xml = buildThoughtsFeed([]);
    expect(xml).not.toContain("<item>");
    expect(xml).not.toContain("lastBuildDate");
  });
});
