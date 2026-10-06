import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("fs", () => ({
  default: {
    existsSync: () => true,
    readFileSync: () =>
      JSON.stringify({
        "photo space.jpg": {
          width: 800,
          height: 600,
          blurDataURL: "data:image/jpeg;base64,AA==",
        },
      }),
  },
}));
vi.mock("@/utils/content/posts", () => ({
  getPostContent: vi.fn(),
  getPostMetadata: () => [
    { title: "Percent tag post", tags: ["100%"], slug: "percent" },
    { title: "Literal escape post", tags: ["literal%2F"], slug: "escape" },
    { title: "Ordinary tag post", tags: ["journal"], slug: "ordinary" },
  ],
}));
vi.mock("@/components/posts/PostPreview", () => ({
  default: ({ title }: { title: string }) =>
    createElement("article", null, title),
}));
import { postSlugFromHref } from "./content/preview";
import { getImageMeta } from "./content/imageMeta";
import { decodeWikiLinkHref } from "@/components/posts/remarkWikiLink";
import TagPage from "@/app/(sidebar)/tags/[slug]/page";
import MarkdownContent from "@/components/posts/MarkdownContent";

describe("Markdown URL fallbacks", () => {
  it("renders raw HTML links with bad escapes as readable fallback links", () => {
    const html = renderToStaticMarkup(
      createElement(MarkdownContent, {
        content:
          '<a href="/posts/%GG">broken post</a> <a href="wikilink:%GG">broken wiki</a>',
      })
    );
    expect(html).toContain("broken post</a>");
    expect(html).toContain("broken wiki</a>");
    expect(html).not.toContain('href="wikilink:');
  });
  it.each(["%", "%GG", "%E0%A4"])(
    "keeps a malformed %s from crashing link/image rendering",
    (escape) => {
      expect(postSlugFromHref(`/posts/${escape}`)).toBeNull();
      expect(getImageMeta(`/images/${escape}.jpg`)).toBeNull();
      expect(decodeWikiLinkHref(`wikilink:${escape}`)).toBeNull();
    }
  );
  it("retains encoded spaces and Unicode in valid links", () => {
    expect(postSlugFromHref("/posts/hello%20world")).toBe("hello world");
    expect(postSlugFromHref("https://bneo.xyz/posts/%E6%97%A5%E8%A8%98")).toBe(
      "日記"
    );
    expect(getImageMeta("/images/photo%20space.jpg")).toMatchObject({
      width: 800,
      height: 600,
    });
    expect(decodeWikiLinkHref("wikilink:paper%20notes")).toBe("paper notes");
  });
  it("does not turn external URLs or encoded traversal into post previews", () => {
    for (const href of [
      "https://elsewhere.example/posts/hello",
      "/posts/%2e%2e",
      "/posts/a%2Fb",
      "/posts/a%5Cb",
    ]) {
      expect(postSlugFromHref(href)).toBeNull();
    }
  });
});

describe("already-decoded tag routes", () => {
  it.each([
    ["100%", "Percent tag post"],
    ["literal%2F", "Literal escape post"],
    ["journal", "Ordinary tag post"],
  ])("renders and filters the literal %s tag", async (slug, title) => {
    const html = renderToStaticMarkup(
      await TagPage({ params: Promise.resolve({ slug }) })
    );
    expect(html).toContain(`<h1`);
    expect(html).toContain(`${slug}</h1>`);
    expect(html).toContain(`<article>${title}</article>`);
    expect(html.match(/<article>/g)).toHaveLength(1);
  });
});
