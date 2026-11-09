import fs from "fs";
import os from "os";
import path from "path";
import { afterAll, describe, expect, it } from "vitest";
import {
  readMarkdownFile,
  scanMarkdownDir,
  writeMarkdownFile,
} from "./markdown";
import { postFrontmatterSchema, wikiFrontmatterSchema } from "./schemas";

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "markdown-test-"));
fs.writeFileSync(
  path.join(dir, "hello.md"),
  `---\ntitle: hello\ntags: [a, b]\n---\n\nbody text\n`
);
fs.writeFileSync(path.join(dir, "notes.txt"), "not markdown");

afterAll(() => fs.rmSync(dir, { recursive: true, force: true }));

describe("readMarkdownFile", () => {
  it.each([
    "body without a newline",
    "body with a newline\n",
    "",
    "\n\nbody\n\n",
  ])("preserves a body exactly during metadata-only changes: %j", (body) => {
    const file = path.join(dir, "migration.md");
    writeMarkdownFile(
      file,
      { title: "unchanged", date: "May 27, 2023", format: "essay" },
      body,
      { preserveBody: true }
    );
    expect(readMarkdownFile(file, postFrontmatterSchema).content).toBe(body);
    fs.unlinkSync(file);
  });
  it("parses frontmatter and content, and is JSON-serializable", () => {
    const result = readMarkdownFile(
      path.join(dir, "hello.md"),
      wikiFrontmatterSchema
    );
    expect(result.data.title).toBe("hello");
    expect(result.content.trim()).toBe("body text");
    // `orig` (a Uint8Array) must be stripped or client components choke
    expect(() => JSON.stringify(result)).not.toThrow();
    expect("orig" in result).toBe(false);
  });
  it("names the file and the field when frontmatter does not match", () => {
    const file = path.join(dir, "hello.md");
    expect(() => readMarkdownFile(file, postFrontmatterSchema)).toThrow(
      `${file}: invalid frontmatter\ndate: required`
    );
  });
});

describe("scanMarkdownDir", () => {
  it("returns slugs for .md files only", () => {
    const files = scanMarkdownDir(dir, wikiFrontmatterSchema);
    expect(files).toHaveLength(1);
    expect(files[0].slug).toBe("hello");
    expect(files[0].data.tags).toEqual(["a", "b"]);
  });

  it("returns [] for a missing directory", () => {
    expect(
      scanMarkdownDir(path.join(dir, "nope"), wikiFrontmatterSchema)
    ).toEqual([]);
  });
});
