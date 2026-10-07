import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ exists: vi.fn(), read: vi.fn() }));
vi.mock("fs", () => ({ default: { existsSync: mocks.exists } }));
vi.mock("./posts", () => ({ getPostContent: mocks.read }));
beforeEach(() => {
  vi.resetModules();
  mocks.exists.mockReset().mockReturnValue(true);
  mocks.read.mockReset().mockReturnValue({
    data: { title: "Title", date: "2026-10-07" },
    content: "# Heading\nHello [world](/wiki/world).",
  });
});
afterEach(() => vi.unstubAllEnvs());
describe("small post previews", () => {
  it("reads only the requested post and retains excerpt formatting", async () => {
    const { getPostPreviewData } = await import("./preview");
    expect(getPostPreviewData("sample")).toEqual({
      slug: "sample",
      title: "Title",
      date: "2026-10-07",
      excerpt: "Heading Hello world.",
    });
    expect(mocks.read).toHaveBeenCalledExactlyOnceWith("sample");
  });
  it("reuses previews only for immutable deployments", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL", "1");
    const { getPostPreviewData } = await import("./preview");
    expect(getPostPreviewData("sample")).toBe(getPostPreviewData("sample"));
    expect(mocks.read).toHaveBeenCalledTimes(1);
  });
  it.each(["development", "test", "production"])(
    "keeps %s local previews fresh",
    async (env) => {
      vi.stubEnv("NODE_ENV", env);
      vi.stubEnv("VERCEL", "");
      const { getPostPreviewData } = await import("./preview");
      getPostPreviewData("sample");
      mocks.read.mockReturnValueOnce({
        data: { title: "Edited", date: "2026-10-07" },
        content: "New writing",
      });
      expect(getPostPreviewData("sample")?.title).toBe("Edited");
      expect(mocks.read).toHaveBeenCalledTimes(2);
    }
  );
  it("rejects traversal and absent posts without content reads", async () => {
    const { getPostPreviewData } = await import("./preview");
    expect(getPostPreviewData("../draft")).toBeNull();
    mocks.exists.mockReturnValue(false);
    expect(getPostPreviewData("absent")).toBeNull();
    expect(mocks.read).not.toHaveBeenCalled();
  });
  it("keeps long excerpts at forty words with the existing ellipsis", async () => {
    mocks.read.mockReturnValue({
      data: { title: "Long", date: "2026-10-07" },
      content: Array.from({ length: 50 }, (_, i) => `word${i}`).join(" "),
    });
    const { getPostPreviewData } = await import("./preview");
    const excerpt = getPostPreviewData("long")!.excerpt;
    expect(excerpt).toContain("word39 …");
    expect(excerpt).not.toContain("word40");
  });
});
