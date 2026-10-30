import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Heatmap from "@/components/visualizations/Heatmap";
import type { PostMetadata } from "@/types/post";

const post = (slug: string, date: string): PostMetadata => ({
  slug,
  date,
  title: "Rice & beans",
  tags: [],
  wordcount: 200,
  isDraft: false,
  prev: null,
  next: null,
});

describe("calendar navigation", () => {
  it("renders a named native link for a day with one post", () => {
    const html = renderToStaticMarkup(
      createElement(Heatmap, {
        posts: [post("rice", "Jan 1, 2026")],
        year: 2026,
        month: 0,
        showNavigation: false,
      })
    );
    expect(html).toContain('href="/posts/rice"');
    expect(html).toContain('aria-label="Thu Jan 01 2026: Rice &amp; beans"');
    expect(html.match(/<a\b/g)).toHaveLength(1);
  });
  it("does not guess a destination when a day has multiple posts", () => {
    const html = renderToStaticMarkup(
      createElement(Heatmap, {
        posts: [post("rice", "Jan 1, 2026"), post("beans", "Jan 1, 2026")],
        year: 2026,
        month: 0,
        showNavigation: false,
      })
    );
    expect(html).not.toContain('href="/posts/');
  });
});
