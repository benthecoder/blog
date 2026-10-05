import { describe, expect, it } from "vitest";
import { mergeLinks } from "./merge";
import { renderWeekly } from "./renderWeekly";
import { parseFooter } from "./notes";

const d = (s: string) => new Date(s);

describe("mergeLinks", () => {
  it("collapses the same url across sources and keeps both signals", () => {
    const [item, ...rest] = mergeLinks([
      {
        source: "curius",
        items: [
          {
            url: "https://www.a.com/x/",
            title: "A",
            savedAt: d("2026-10-01"),
            highlights: ["q"],
          },
        ],
      },
      {
        source: "tweets",
        items: [
          {
            url: "https://a.com/x#frag",
            title: "A",
            savedAt: d("2026-10-02"),
            highlights: [],
            take: "good",
          },
        ],
      },
    ]);
    expect(rest).toHaveLength(0);
    expect(item.highlights).toEqual(["q"]);
    expect(item.take).toBe("good");
    expect(item.sources).toEqual(["curius", "tweets"]);
  });
});

describe("renderWeekly", () => {
  it("gives annotated links a take slot and bare links an also entry", () => {
    const out = renderWeekly([
      {
        url: "https://a.com",
        title: "A",
        savedAt: d("2026-10-01"),
        highlights: ["q1", "q2"],
        sources: ["curius"],
      },
      {
        url: "https://b.com",
        title: "B",
        savedAt: d("2026-10-01"),
        highlights: [],
        sources: ["curius"],
      },
    ]);
    expect(out).toContain("  - take:");
    expect(out).toContain("  > q1\n  >\n  > q2");
    expect(out).toMatch(/also\n\n- \[B\]/);
  });
});

describe("parseFooter", () => {
  const post =
    "- [a](https://a.com)\n\nread\n\n- book one\n- \n\nwatch\n\n- film one\n- film two\n\nnote";

  it("returns only bullets under the requested heading, skipping empty ones", () => {
    expect(parseFooter(post, "read")).toEqual(["- book one"]);
    expect(parseFooter(post, "watch")).toEqual(["- film one", "- film two"]);
  });

  it("ignores bullets before any heading", () => {
    expect(parseFooter("- stray\n\nwatch\n\n- x", "read")).toEqual([]);
  });
});
