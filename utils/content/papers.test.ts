import fs from "fs";
import { describe, expect, it } from "vitest";
import { PAPERS_MD } from "@/config/paths";
import { parsePaperLine, parsePaperList, stripComments } from "./papers";

describe("paper list", () => {
  it("strips comments, including unclosed ones", () => {
    expect(stripComments("a<!-- x -->b<!--<!-- y -->c<!-- open")).toBe("abc");
  });

  it("parses one-line entries", () => {
    expect(
      parsePaperLine(
        "- [Attention Is All You Need](https://arxiv.org/abs/1706.03762) — Vaswani et al., 2017 · read 2026-10-12"
      )
    ).toEqual({
      title: "Attention Is All You Need",
      url: "https://arxiv.org/abs/1706.03762",
      authors: "Vaswani et al.",
      year: "2017",
      read: "2026-10-12",
    });
    expect(
      parsePaperLine("- [X](https://x.org) — Someone (2020)")
    ).toMatchObject({
      authors: "Someone",
      year: "2020",
      read: "",
    });
    expect(parsePaperLine("just prose")).toBeNull();
  });

  it("splits sections, groups read papers by month and links notes", () => {
    const list = parsePaperList(
      [
        "<!-- - [Hidden](https://h.org) — H, 2000 -->",
        "## up next",
        "- [BERT: Pre-training of Deep Bidirectional Transformers](https://a.org/bert) — Devlin et al., 2018",
        "## read",
        "- [Old](https://a.org/old) — A, 2010 · read 2026-09",
        "- [New](https://a.org/new) — B, 2020 · read 2026-10-02",
        "- [Newer](https://a.org/newer) — C, 2021 · read 2026-10-09",
        "- [Undated](https://a.org/u) — D, 2001",
      ].join("\n"),
      [
        { slug: "bert", title: "BERT" },
        { slug: "old-paper", title: "Old" },
      ]
    );
    expect(list.upNext.map((p) => [p.title.split(":")[0], p.note])).toEqual([
      ["BERT", "/wiki/bert"],
    ]);
    expect(
      list.read.map((g) => [g.month, g.papers.map((p) => p.title)])
    ).toEqual([
      ["2026-10", ["Newer", "New"]],
      ["2026-09", ["Old"]],
      ["", ["Undated"]],
    ]);
    expect(list.read[1].papers[0].note).toBe("/wiki/old-paper");
    expect(list.read[0].papers[0].note).toBe("");
  });

  it("ships a list whose entries all parse", () => {
    const raw = fs.readFileSync(PAPERS_MD, "utf8");
    const list = parsePaperList(raw);
    const lines = stripComments(raw)
      .split("\n")
      .filter((l) => l.trim().startsWith("- "));
    expect(list.upNext.length + list.read.flatMap((g) => g.papers).length).toBe(
      lines.length
    );
    expect(
      list.upNext.every(
        (p) => p.authors && p.year && p.url.startsWith("https://")
      )
    ).toBe(true);
  });
});
