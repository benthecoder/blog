import path from "path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const fixtures = vi.hoisted(() => ({ scan: vi.fn() }));
vi.mock("./markdown", () => ({
  scanMarkdownDir: fixtures.scan,
  readMarkdownFile: vi.fn(),
}));

const published = [
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
];
const drafts = [
  { slug: "wip", data: { title: "Wip", date: "2026-05-01" }, content: "x" },
];

beforeEach(() => {
  vi.resetModules();
  fixtures.scan
    .mockReset()
    .mockImplementation((dir: string) =>
      path.basename(dir) === "drafts" ? drafts : published
    );
});

describe("essay metadata", () => {
  it("sorts newest first and parses frontmatter", async () => {
    const { getEssayMetadata } = await import("./essays");
    const essays = getEssayMetadata();
    expect(essays.map((e) => e.slug)).toEqual(["newer", "older"]);
    const [newer, older] = essays;
    expect(newer.date).toBe("2026-03-01");
    expect(newer.updated).toBe("2026-04-01");
    expect(newer.tags).toEqual(["a", "b"]);
    expect(newer.subtitle).toBe("second");
    expect(newer.readingTime).toBe(2);
    expect(older.updated).toBeNull();
    expect(older.readingTime).toBe(1);
  });

  it("never reads the drafts folder for public pages", async () => {
    const { getEssayMetadata } = await import("./essays");
    getEssayMetadata();
    const dirs = fixtures.scan.mock.calls.map(([dir]) => path.basename(dir));
    expect(dirs).toEqual(["essays"]);
  });

  it("lists drafts and published essays for the admin", async () => {
    const { getEssayAdminList } = await import("./essays");
    expect(getEssayAdminList().map((e) => [e.slug, e.isDraft])).toEqual([
      ["wip", true],
      ["newer", false],
      ["older", false],
    ]);
  });
});
