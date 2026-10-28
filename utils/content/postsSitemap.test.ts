import { describe, expect, it } from "vitest";
import { buildPostsSitemap } from "./postsSitemap";

const SITE = "https://bneo.xyz";

describe("buildPostsSitemap", () => {
  it("emits loc and a YYYY-MM-DD lastmod from the post date", () => {
    const xml = buildPostsSitemap(SITE, [
      { slug: "hello", date: "Feb 24, 2024" },
      { slug: "older", date: "Jan 5, 2020" },
    ]);
    expect(xml).toContain(
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
    );
    expect(xml).toContain(
      "<url><loc>https://bneo.xyz/posts/hello</loc><lastmod>2024-02-24</lastmod></url>"
    );
    expect(xml).toContain(
      "<url><loc>https://bneo.xyz/posts/older</loc><lastmod>2020-01-05</lastmod></url>"
    );
    expect(xml).not.toMatch(/changefreq|priority/);
  });

  it("keeps the input order", () => {
    const xml = buildPostsSitemap(SITE, [
      { slug: "b", date: "Feb 2, 2024" },
      { slug: "a", date: "Feb 1, 2024" },
    ]);
    expect(xml.indexOf("/posts/b")).toBeLessThan(xml.indexOf("/posts/a"));
  });

  it("escapes XML special characters in slugs", () => {
    const xml = buildPostsSitemap(SITE, [
      { slug: "a&b<c", date: "Feb 24, 2024" },
    ]);
    expect(xml).toContain("/posts/a&amp;b&lt;c</loc>");
    expect(xml).not.toContain("a&b<c");
  });

  it("omits lastmod for unparseable dates", () => {
    const xml = buildPostsSitemap(SITE, [{ slug: "x", date: "not a date" }]);
    expect(xml).toContain("<url><loc>https://bneo.xyz/posts/x</loc></url>");
    expect(xml).not.toContain("lastmod");
  });
});
