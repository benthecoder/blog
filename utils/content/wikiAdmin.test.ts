import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ root: "" }));
vi.mock("@/config/paths", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/config/paths")>();
  return {
    ...original,
    getWikiPath: (slug: string) => path.join(state.root, `${slug}.md`),
  };
});
import { getWikiEditorPage, saveWikiEditorPage } from "./wikiAdmin";
import { readMarkdownFile, writeMarkdownFile } from "./markdown";

const page = {
  slug: "christianity",
  title: " Christianity ",
  category: " religion/christianity ",
  description: " Notes ",
  tags: "faith, history, faith",
  content: "# Notes\n\n[[Jesus]]\n",
  create: true,
};

beforeEach(() => {
  state.root = fs.mkdtempSync(path.join(os.tmpdir(), "wiki-admin-"));
});
afterEach(() => {
  fs.rmSync(state.root, { recursive: true, force: true });
});

describe("local wiki authoring", () => {
  it("creates readable Markdown with normalized metadata", () => {
    const saved = saveWikiEditorPage(page);
    expect(saved).toMatchObject({
      title: "Christianity",
      category: "religion/christianity",
      description: "Notes",
      tags: ["faith", "history"],
      content: page.content,
    });
    expect(saved.version).toMatch(/^[a-f0-9]{64}$/);
    expect(
      readMarkdownFile(path.join(state.root, "christianity.md")).content
    ).toBe(page.content);
    expect(fs.readdirSync(state.root)).toEqual(["christianity.md"]);
  });
  it("rejects duplicate names without replacing the original", () => {
    saveWikiEditorPage(page);
    expect(() =>
      saveWikiEditorPage({ ...page, content: "replacement" })
    ).toThrow("already uses");
    expect(getWikiEditorPage(page.slug).content).toBe(page.content);
  });
  it("preserves custom frontmatter on update", () => {
    writeMarkdownFile(
      path.join(state.root, "christianity.md"),
      { title: "Old", category: "religion", custom: { source: "books" } },
      "Old text\n"
    );
    const original = getWikiEditorPage(page.slug);
    const saved = saveWikiEditorPage({
      ...page,
      create: false,
      version: original.version,
    });
    expect(saved.version).not.toBe(original.version);
    expect(
      readMarkdownFile(path.join(state.root, "christianity.md")).data.custom
    ).toEqual({ source: "books" });
  });
  it("rejects stale saves after another tab or IDE edits the file", () => {
    const original = saveWikiEditorPage(page);
    const latest = saveWikiEditorPage({
      ...page,
      create: false,
      version: original.version,
      content: "Changed elsewhere\n",
    });
    expect(() =>
      saveWikiEditorPage({ ...page, create: false, version: original.version })
    ).toThrow("changed since");
    expect(getWikiEditorPage(page.slug).content).toBe(latest.content);
  });
  it.each(["../escape", "a/b", "new", ["christianity"], "", "a.md"])(
    "rejects invalid address %j",
    (slug) => {
      expect(() => saveWikiEditorPage({ ...page, slug })).toThrow(
        "page address"
      );
      expect(fs.readdirSync(state.root)).toEqual([]);
    }
  );
  it("rejects blank titles and missing versions", () => {
    expect(() => saveWikiEditorPage({ ...page, title: " " })).toThrow(
      "Invalid page fields"
    );
    saveWikiEditorPage(page);
    expect(() => saveWikiEditorPage({ ...page, create: false })).toThrow(
      "version required"
    );
  });
  it("does not follow symlinks", () => {
    writeMarkdownFile(
      path.join(state.root, "target.md"),
      { title: "Target" },
      "Original\n"
    );
    fs.symlinkSync(
      path.join(state.root, "target.md"),
      path.join(state.root, "christianity.md")
    );
    expect(() => getWikiEditorPage(page.slug)).toThrow("regular file");
    expect(() => saveWikiEditorPage(page)).toThrow("already uses");
    expect(readMarkdownFile(path.join(state.root, "target.md")).content).toBe(
      "Original\n"
    );
  });
});
