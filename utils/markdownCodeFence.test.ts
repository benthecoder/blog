import { createElement } from "react";
import { renderToReadableStream } from "react-dom/server";
import { describe, expect, it } from "vitest";
import MarkdownContent from "@/components/posts/MarkdownContent";
import { codeToHtml } from "./codeHighlighting";

const themes = { light: "one-light", dark: "dracula" } as const;

describe("published code fences", () => {
  it.each([
    ["c++", "template<typename T> T twice(T n) { return n + n; }"],
    ["c#", "public record Person(string Name);"],
    ["objective-c", "@interface Person : NSObject\n@end"],
    ["js", "const answer = 42;"],
  ])("uses the complete %s language name", async (lang, code) => {
    const stream = await renderToReadableStream(
      createElement(MarkdownContent, {
        content: `\`\`\`${lang}\n${code}\n\`\`\``,
      })
    );
    await stream.allReady;
    const html = await new Response(stream).text();
    expect(html).toContain(await codeToHtml(code, { lang, themes }));
    expect(html).toContain('aria-label="Copy code"');
  });

  it("keeps unknown languages as escaped plain text", async () => {
    const stream = await renderToReadableStream(
      createElement(MarkdownContent, {
        content: "```not-a-language\n<script>alert(1)</script>\n```",
      })
    );
    await stream.allReady;
    const html = await new Response(stream).text();
    expect(html).toContain(
      '<pre class="shiki"><code>&lt;script&gt;alert(1)&lt;/script&gt;</code></pre>'
    );
  });
});
