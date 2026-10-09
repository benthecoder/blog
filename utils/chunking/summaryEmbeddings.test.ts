import { describe, expect, it } from "vitest";
import { imputeMissing } from "./summaryEmbeddings";
import {
  buildSummaryPrompt,
  cleanPostText,
  validSummaries,
  pendingSummaries,
} from "./postSummaries";

describe("imputeMissing", () => {
  it("fills a missing post from its nearest embedded neighbours", () => {
    const space = [
      [1, 0],
      [0.99, 0.1],
      [0, 1],
      [1, 0.05], // missing, sits next to the first two
    ];
    const vectors: (number[] | null)[] = [
      [1, 0, 0],
      [1, 0, 0],
      [0, 1, 0],
      null,
    ];
    const out = imputeMissing(vectors, space, 2);
    expect(out[3][0]).toBeCloseTo(1);
    expect(out[3][1]).toBeCloseTo(0);
    expect(out[0]).toBe(vectors[0]);
  });
});

describe("summary helpers", () => {
  it("cleans frontmatter, images, links and template lines from a post", () => {
    const md = `---\ntitle: 'x'\n---\n\n![pic](/a.jpg)\n\nreading about [vector search](https://x.com) today\n\n---\n\nmood: 3/5\nwake: 9:00\n`;
    expect(cleanPostText(md, 500)).toBe("reading about vector search today");
  });

  it("truncates to the character budget", () => {
    expect(cleanPostText("word ".repeat(1000), 50)).toHaveLength(50);
  });

  it("keeps only requested, well-formed, unique summaries", () => {
    const out = validSummaries(
      {
        summaries: [
          {
            id: "a",
            summary: "A thoughtful look at how habits form over time.",
          },
          {
            id: "a",
            summary: "A duplicate entry that should be ignored entirely.",
          },
          { id: "b", summary: "too short" },
          {
            id: "zzz",
            summary: "An id nobody asked for but long enough to pass.",
          },
        ],
      },
      ["a", "b", "c"]
    );
    expect([...out.keys()]).toEqual(["a"]);
  });

  it("only asks for posts that are new or changed", () => {
    const item = (slug: string, hash: string) => ({
      slug,
      title: slug,
      tags: "",
      text: "t",
      hash,
    });
    const pending = pendingSummaries([item("a", "1"), item("b", "2")], {
      a: { hash: "1", summary: "done" },
      b: { hash: "old", summary: "stale" },
    });
    expect(pending.map((p) => p.slug)).toEqual(["b"]);
    expect(buildSummaryPrompt(pending)).toContain("### b");
  });
});
