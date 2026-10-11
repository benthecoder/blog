import fs from "fs";
import os from "os";
import path from "path";
import { afterAll, describe, expect, it, vi } from "vitest";

const root = vi.hoisted(() => ({ dir: "" }));
vi.mock("@/config/paths", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/config/paths")>();
  const fsm = await import("fs");
  const osm = await import("os");
  const pathm = await import("path");
  root.dir = fsm.mkdtempSync(pathm.join(osm.tmpdir(), "wiki-templates-"));
  return { ...original, WIKI_TEMPLATES_DIR: root.dir };
});
import { getWikiTemplates } from "./wikiTemplates";

afterAll(() => fs.rmSync(root.dir, { recursive: true, force: true }));

describe("wiki templates", () => {
  it("loads Markdown templates in order after Blank", () => {
    fs.writeFileSync(
      path.join(root.dir, "paper.md"),
      "---\nlabel: Paper note\norder: 1\ncategory: papers/\ntags: paper\npaper: true\n---\n## Source\n"
    );
    fs.writeFileSync(
      path.join(root.dir, "aaa.md"),
      "---\nlabel: Later\n---\nBody\n"
    );
    const templates = getWikiTemplates();
    expect(templates.map((t) => t.key)).toEqual(["blank", "paper", "aaa"]);
    expect(templates[1]).toMatchObject({
      label: "Paper note",
      category: "papers/",
      tags: "paper",
      paper: true,
      content: "## Source\n",
    });
  });
  it("ships the repo's paper template with its headings", async () => {
    const real = path.join(process.cwd(), "templates", "wiki", "paper.md");
    const text = fs.readFileSync(real, "utf8");
    for (const heading of [
      "Source",
      "Question",
      "Method",
      "Evidence",
      "Questions",
      "Connections",
    ])
      expect(text).toContain(`## ${heading}\n`);
    void os;
  });
});
