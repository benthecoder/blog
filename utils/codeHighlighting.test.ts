import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { codeToHtml as originalCodeToHtml } from "shiki";
import { POSTS_DIR } from "@/config/paths";
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

  it("highlights every fenced code block language used across published posts", async () => {
    const langs = new Set<string>();
    for (const entry of fs.readdirSync(POSTS_DIR, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
      const markdown = fs.readFileSync(
        path.join(POSTS_DIR, entry.name),
        "utf8"
      );
      for (const match of markdown.matchAll(/^```(\S+)/gm)) {
        langs.add(match[1]);
      }
    }

    expect(langs.size).toBeGreaterThan(0);
    for (const lang of langs) {
      await expect(codeToHtml("x = 1", { lang, themes })).resolves.toContain(
        "<pre"
      );
    }
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
