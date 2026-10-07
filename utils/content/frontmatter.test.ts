import { describe, expect, it } from "vitest";
import { parseFrontmatter, stringifyFrontmatter } from "./frontmatter";

describe("YAML frontmatter boundary", () => {
  it("round-trips writing metadata and preserves Markdown bodies", () => {
    const data = {
      title: "hello: #world",
      tags: ["日記", "journal"],
      date: new Date("2026-10-07T00:00:00Z"),
      description: "first line\nsecond line",
    };
    const content = "\nA paragraph.\n\n---\n\nA horizontal rule above.\n";
    expect(parseFrontmatter(stringifyFrontmatter(content, data))).toEqual({
      data,
      content,
    });
  });
  it("handles plain Markdown, empty metadata, BOM and CRLF", () => {
    expect(parseFrontmatter("plain\ntext")).toEqual({
      data: {},
      content: "plain\ntext",
    });
    expect(parseFrontmatter("---\n---\nbody")).toEqual({
      data: {},
      content: "body",
    });
    expect(
      parseFrontmatter("\uFEFF---\r\ntitle: hello\r\n---\r\nbody\r\n")
    ).toEqual({
      data: { title: "hello" },
      content: "body\r\n",
    });
  });
  it("rejects executable engines, unsafe YAML types and malformed metadata", () => {
    for (const source of [
      "---javascript\nthrow new Error('executed')\n---\nbody",
      "---js\n({ title: 'executed' })\n---\nbody",
      "---\ntitle: !!js/function function() {}\n---\nbody",
      "---\n[a, b]\n---\nbody",
      "---\nhello\n---\nbody",
      "---\ntitle: unfinished",
    ])
      expect(() => parseFrontmatter(source)).toThrow();
  });
});
