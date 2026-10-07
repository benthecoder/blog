import { describe, expect, it } from "vitest";
import { codeToHtml as originalCodeToHtml } from "shiki";
import { codeToHtml } from "./codeHighlighting";

const themes = { light: "one-light", dark: "dracula" } as const;

describe("Markdown syntax highlighting", () => {
  it.each([
    ["py", 'print("<script> & hello")'],
    ["js", "const answer = 42;"],
    ["md", "```javascript\nconst embedded = true;\n```"],
    ["vue", '<script lang="ts">const name: string = "ben";</script>'],
    ["ruby", 'puts "hello"'],
    ["yaml", "title: blog\ntags: [writing, code]"],
    ["txt", "<script>alert('hello')</script>"],
  ])("preserves both themes and escaping for %s", async (lang, code) => {
    const options = { lang, themes };
    const [before, after] = await Promise.all([
      originalCodeToHtml(code, options),
      codeToHtml(code, options),
    ]);
    expect(after).toBe(before);
  });

  it("still rejects unsupported languages for the renderer's plain-text fallback", async () => {
    await expect(
      codeToHtml("<script>hello</script>", {
        lang: "not-a-real-language",
        themes,
      })
    ).rejects.toThrow();
  });
});
