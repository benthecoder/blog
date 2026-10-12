import fs from "fs";
import path from "path";
import { afterAll, describe, expect, it, vi } from "vitest";

const root = vi.hoisted(() => ({ dir: "" }));
vi.mock("@/config/paths", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/config/paths")>();
  const fsm = await import("fs");
  const osm = await import("os");
  const pathm = await import("path");
  root.dir = fsm.mkdtempSync(pathm.join(osm.tmpdir(), "papers-"));
  return { ...original, WIKI_DIR: root.dir };
});
import { getPapers, groupPapersByTopic } from "./papers";

afterAll(() => fs.rmSync(root.dir, { recursive: true, force: true }));

function page(slug: string, frontmatter: string) {
  fs.writeFileSync(
    path.join(root.dir, `${slug}.md`),
    `---\n${frontmatter}\n---\nBody\n`
  );
}

describe("papers", () => {
  it("lists papers/ wiki pages newest-read first, grouped in topic order", () => {
    page(
      "attention",
      "title: Attention Is All You Need\ncategory: papers/llms-and-agents\nauthors: Vaswani et al.\nyear: 2017\nread: 2026-10-01"
    );
    page(
      "rlhf",
      "title: InstructGPT\ncategory: papers/llms-and-agents\nyear: 2022\nread: 2026-10-09"
    );
    page(
      "pitfalls",
      "title: ML Pitfalls\ncategory: papers/deep-learning-foundations"
    );
    page("odd", "title: Odd\ncategory: papers/new-topic\nread: 2026-01-01");
    page("christianity", "title: Christianity\ncategory: religion");
    const papers = getPapers();
    expect(papers.map((p) => p.slug)).toEqual([
      "rlhf",
      "attention",
      "odd",
      "pitfalls",
    ]);
    expect(papers[1]).toMatchObject({
      authors: "Vaswani et al.",
      year: "2017",
    });
    const groups = groupPapersByTopic(papers);
    expect(groups.map((g) => [g.label, g.papers.map((p) => p.slug)])).toEqual([
      ["LLMs & Agents", ["rlhf", "attention"]],
      ["Deep Learning Foundations", ["pitfalls"]],
      ["New topic", ["odd"]],
    ]);
  });
});
