import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const fixtures = vi.hoisted(() => ({
  published: [
    {
      slug: "newer",
      data: { title: "Newer", date: "2026-10-06", tags: ["journal"] },
      content: "Two words\n> quoted words omitted",
    },
    {
      slug: "older",
      data: { title: "Older", date: "2026-10-01", tags: [] },
      content: "One",
    },
  ],
  drafts: [
    {
      slug: "draft",
      data: { title: "Draft", date: "2026-10-07", tags: [] },
      content: "Draft writing",
    },
  ],
  scan: vi.fn(),
  slugs: vi.fn(),
}));
vi.mock("./markdown", () => ({
  scanMarkdownDir: fixtures.scan,
  scanMarkdownSlugs: fixtures.slugs,
}));
beforeEach(() => {
  vi.resetModules();
  fixtures.slugs.mockReset().mockReturnValue(["newer", "older"]);
  fixtures.scan
    .mockReset()
    .mockImplementation((directory: string) =>
      (directory.endsWith("drafts") ? fixtures.drafts : fixtures.published).map(
        (item) => ({ ...item, data: { ...item.data } })
      )
    );
});
afterEach(() => vi.unstubAllEnvs());

describe("published metadata index", () => {
  it("reuses the deployed slug list without reading or parsing post bodies", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL", "1");
    const { getPostSlugs } = await import("./posts");
    expect(getPostSlugs()).toEqual(["newer", "older"]);
    getPostSlugs();
    expect(fixtures.slugs).toHaveBeenCalledTimes(1);
    expect(fixtures.scan).not.toHaveBeenCalled();
  });
  it.each([
    ["development", "1"],
    ["test", "1"],
    ["production", ""],
  ])(
    "refreshes slugs after a local publish in %s (VERCEL=%s)",
    async (environment, vercel) => {
      vi.stubEnv("NODE_ENV", environment);
      vi.stubEnv("VERCEL", vercel);
      const { getPostSlugs } = await import("./posts");
      expect(getPostSlugs()).toEqual(["newer", "older"]);
      fixtures.slugs.mockReturnValue(["newer", "older", "just-published"]);
      expect(getPostSlugs()).toEqual(["newer", "older", "just-published"]);
      expect(fixtures.slugs).toHaveBeenCalledTimes(2);
    }
  );
  it("reuses immutable Vercel files across separate calls", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL", "1");
    const { getPostMetadata } = await import("./posts");
    const first = getPostMetadata();
    expect(getPostMetadata({ includeDrafts: false })).toBe(first);
    expect(fixtures.scan).toHaveBeenCalledTimes(1);
    expect(first.map((post) => post.slug)).toEqual(["newer", "older"]);
    expect(first[0].wordcount).toBe(2);
    expect(first[0].prev?.slug).toBe("older");
    expect(first[1].next?.slug).toBe("newer");
  });
  it.each(["development", "test"])(
    "refreshes local %s content after a save",
    async (environment) => {
      vi.stubEnv("NODE_ENV", environment);
      vi.stubEnv("VERCEL", "1");
      const { getPostMetadata } = await import("./posts");
      expect(getPostMetadata()[0].title).toBe("Newer");
      fixtures.scan.mockReturnValueOnce([
        {
          ...fixtures.published[0],
          data: { ...fixtures.published[0].data, title: "Updated locally" },
        },
      ]);
      expect(getPostMetadata()[0].title).toBe("Updated locally");
      expect(fixtures.scan).toHaveBeenCalledTimes(2);
    }
  );
  it("refreshes standalone production servers too", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL", "");
    const { getPostMetadata } = await import("./posts");
    getPostMetadata();
    getPostMetadata();
    expect(fixtures.scan).toHaveBeenCalledTimes(2);
  });
  it("keeps draft-inclusive scans fresh without changing the published index", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL", "1");
    const { getPostMetadata } = await import("./posts");
    const published = getPostMetadata();
    expect(
      getPostMetadata({ includeDrafts: true }).some((post) => post.isDraft)
    ).toBe(true);
    getPostMetadata({ includeDrafts: true });
    expect(getPostMetadata()).toBe(published);
    expect(fixtures.scan).toHaveBeenCalledTimes(5);
    expect(published.map((post) => post.slug)).not.toContain("draft");
  });
});
