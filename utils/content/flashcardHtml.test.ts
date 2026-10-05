import { describe, expect, it } from "vitest";
import { sanitizeFlashcardHtml } from "./flashcardHtml";

describe("sanitizeFlashcardHtml", () => {
  it("preserves card formatting and meaningful whitespace", () => {
    const html =
      "<p><strong>Word</strong><br /><em>Meaning</em></p><pre>a  b\n c</pre>";
    expect(sanitizeFlashcardHtml(html)).toBe(html);
  });

  it.each([
    "<div onclick=alert(1)>word</div>",
    '<div oNcLiCk="alert(1)">word</div>',
    "<div onclick='alert(1)' style='color:red' class='card'>word</div>",
  ])("removes all attributes from formatting tags: %s", (html) => {
    expect(sanitizeFlashcardHtml(html)).toBe("<div>word</div>");
  });

  it.each([
    "<script>alert(1)</script>word",
    "<style>body{display:none}</style>word",
    '<iframe srcdoc="<script>alert(1)</script>"></iframe>word',
    "<svg><script>alert(1)</script></svg>word",
    "<math><mi onclick=alert(1)>bad</mi></math>word",
    "<img src=x onerror=alert(1)>word",
    '<a href="javascript:alert(1)">word</a>',
    '<a href="&#106;avascript:alert(1)">word</a>',
    "<scr<script>ipt>alert(1)</scr<script>ipt>word",
  ])("rejects executable and malformed markup: %s", (html) => {
    const result = sanitizeFlashcardHtml(html);
    expect(result).not.toMatch(/<(?:script|style|iframe|svg|math|img|a)\b/i);
    expect(result).not.toMatch(/\son\w+\s*=|javascript:/i);
    expect(result).toContain("word");
  });

  it("removes Anki local media placeholders", () => {
    expect(sanitizeFlashcardHtml("[sound:local.mp3]word[anki:tts]")).toBe(
      "word"
    );
  });
});
