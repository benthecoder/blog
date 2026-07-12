import fs from "fs";
import os from "os";
import path from "path";
import { afterAll, describe, expect, it } from "vitest";
import { readMarkdownFile, scanMarkdownDir } from "./markdown";

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "markdown-test-"));
fs.writeFileSync(
  path.join(dir, "hello.md"),
  `---\ntitle: hello\ntags: [a, b]\n---\n\nbody text\n`
);
fs.writeFileSync(path.join(dir, "notes.txt"), "not markdown");

afterAll(() => fs.rmSync(dir, { recursive: true, force: true }));

describe("readMarkdownFile", () => {
  it("parses frontmatter and content, and is JSON-serializable", () => {
    const result = readMarkdownFile(path.join(dir, "hello.md"));
    expect(result.data.title).toBe("hello");
    expect(result.content.trim()).toBe("body text");
    // `orig` (a Uint8Array) must be stripped or client components choke
    expect(() => JSON.stringify(result)).not.toThrow();
    expect("orig" in result).toBe(false);
  });
});

describe("scanMarkdownDir", () => {
  it("returns slugs for .md files only", () => {
    const files = scanMarkdownDir(dir);
    expect(files).toHaveLength(1);
    expect(files[0].slug).toBe("hello");
    expect(files[0].data.tags).toEqual(["a", "b"]);
  });

  it("returns [] for a missing directory", () => {
    expect(scanMarkdownDir(path.join(dir, "nope"))).toEqual([]);
  });
});
