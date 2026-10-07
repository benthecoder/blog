import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ReactMarkdown from "react-markdown";
import katex from "katex";
import { describe, expect, it } from "vitest";
import {
  remarkPlugins,
  rehypePlugins,
} from "@/components/posts/markdownConfig";

describe("patched math rendering", () => {
  it("renders inline and display math through the site's Markdown pipeline", () => {
    const html = renderToStaticMarkup(
      createElement(
        ReactMarkdown,
        {
          remarkPlugins,
          rehypePlugins,
        },
        "Inline $x^2$ and a fraction:\n\n$$\n\\frac{a}{b}\n$$"
      )
    );
    expect(html).toContain('class="katex"');
    expect(html).toContain('class="katex-display"');
    expect(html).toContain("<math");
    expect(html).toContain("<mfrac>");
    expect(html).not.toContain("katex-error");
  });
  it("does not inherit trusted rendering from the options prototype", () => {
    const options = Object.assign(Object.create({ trust: true }), {
      strict: false,
      throwOnError: false,
    });
    const html = katex.renderToString(
      String.raw`\href{javascript:alert(1)}{click}`,
      options
    );
    expect(html).not.toContain('href="javascript:');
    expect(html).not.toContain("<a ");
  });
});
