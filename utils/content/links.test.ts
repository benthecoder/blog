import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ scan: vi.fn() }));
vi.mock("./markdown", () => ({ scanMarkdownDir: mocks.scan }));
const wiki = {
  slug: "topic",
  data: { title: "Shared title" },
  content: "[[entry]]",
};
const post = {
  slug: "entry",
  data: { title: "Shared title" },
  content: "[[topic]]",
};
beforeEach(() => {
  vi.resetModules();
  mocks.scan
    .mockReset()
    .mockImplementation((dir: string) =>
      dir.endsWith("wiki") ? [wiki] : [post]
    );
});
afterEach(() => vi.unstubAllEnvs());
describe("published link graph snapshot", () => {
  it("shares one scan/resolver/graph across deployed requests and keeps wiki precedence", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL", "1");
    const { getLinkIndex, getLinkGraph, getBacklinks } = await import(
      "./links"
    );
    const index = getLinkIndex(),
      graph = getLinkGraph();
    expect(getLinkIndex()).toBe(index);
    expect(getLinkGraph()).toBe(graph);
    expect(mocks.scan).toHaveBeenCalledTimes(2);
    expect(index.resolve("Shared title")?.ref).toEqual({
      kind: "wiki",
      slug: "topic",
    });
    expect(
      getBacklinks({ kind: "wiki", slug: "topic" }).map((entry) => entry.ref)
    ).toEqual([{ kind: "post", slug: "entry" }]);
    expect(
      getBacklinks({ kind: "post", slug: "entry" }).map((entry) => entry.ref)
    ).toEqual([{ kind: "wiki", slug: "topic" }]);
    expect(index.entries.every((entry) => !("content" in entry))).toBe(true);
    expect(
      getBacklinks({ kind: "wiki", slug: "topic" }).every(
        (entry) => !("content" in entry)
      )
    ).toBe(true);
  });
  it.each(["development", "test", "production"])(
    "refreshes local %s snapshots after writing",
    async (env) => {
      vi.stubEnv("NODE_ENV", env);
      vi.stubEnv("VERCEL", "");
      const { getLinkIndex, getLinkGraph } = await import("./links");
      expect(getLinkIndex().resolve("entry")?.title).toBe("Shared title");
      expect(
        getLinkGraph().backlinks({ kind: "wiki", slug: "topic" })
      ).toHaveLength(1);
      mocks.scan.mockImplementation((dir: string) =>
        dir.endsWith("wiki")
          ? [wiki]
          : [{ ...post, data: { title: "Edited" }, content: "" }]
      );
      expect(getLinkIndex().resolve("entry")?.title).toBe("Edited");
      expect(
        getLinkGraph().backlinks({ kind: "wiki", slug: "topic" })
      ).toHaveLength(0);
      expect(mocks.scan).toHaveBeenCalledTimes(8);
    }
  );
});
