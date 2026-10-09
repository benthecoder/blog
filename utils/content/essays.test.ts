import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fixtures = vi.hoisted(() => ({ scan: vi.fn() }));
vi.mock("./markdown", () => ({
  scanMarkdownDir: fixtures.scan,
  readMarkdownFile: vi.fn(),
}));

beforeEach(() => {
  vi.resetModules();
  fixtures.scan.mockReset().mockReturnValue([
    {
      slug: "older",
      data: { title: "Older", subtitle: "first", date: "2026-01-01" },
      content: "one two three",
    },
    {
      slug: "newer",
      data: {
        title: "Newer",
        subtitle: "second",
        date: new Date("2026-03-01"),
        updated: "2026-04-01",
        tags: "a, b",
      },
      content: "word ".repeat(400),
    },
    {
      slug: "_draft",
      data: { title: "Draft", date: "2026-05-01" },
      content: "draft",
    },
  ]);
});
afterEach(() => vi.unstubAllEnvs());

describe("essay metadata", () => {
  it("sorts newest first and parses frontmatter", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const { getEssayMetadata } = await import("./essays");
    const essays = getEssayMetadata();
    expect(essays.map((e) => e.slug)).toEqual(["_draft", "newer", "older"]);
    const newer = essays[1];
    expect(newer.date).toBe("2026-03-01");
    expect(newer.updated).toBe("2026-04-01");
    expect(newer.tags).toEqual(["a", "b"]);
    expect(newer.subtitle).toBe("second");
    expect(newer.readingTime).toBe(2);
    expect(essays[2].updated).toBeNull();
    expect(essays[2].readingTime).toBe(1);
  });

  it("excludes underscore files in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const { getEssayMetadata, getEssayContent } = await import("./essays");
    expect(getEssayMetadata().map((e) => e.slug)).toEqual(["newer", "older"]);
    expect(() => getEssayContent("_draft")).toThrow();
  });
});
