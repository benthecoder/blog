import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { QuoteFooter } from "@/components/layout/QuoteFooter";

describe("quote footer", () => {
  it("encodes stored slugs as one URL segment and escapes quote text", () => {
    const slug = "<img src=x onerror=alert(1)>?#";
    const html = renderToStaticMarkup(
      createElement(QuoteFooter, {
        quotes: [{ slug, text: "<script>alert(1)</script>", author: "<img>" }],
      })
    );
    expect(html).toContain(`href="/posts/${encodeURIComponent(slug)}"`);
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;script&gt;");
  });

  it("preserves ordinary post links and renders nothing without quotes", () => {
    expect(
      renderToStaticMarkup(
        createElement(QuoteFooter, {
          quotes: [{ slug: "011126", text: "A quote", author: "Author" }],
        })
      )
    ).toContain('href="/posts/011126"');
    expect(
      renderToStaticMarkup(createElement(QuoteFooter, { quotes: [] }))
    ).toBe("");
  });
});
