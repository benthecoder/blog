import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});
describe("shared search index", () => {
  it("downloads once for concurrent consumers and reuses the engine", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response("[]"));
    vi.stubGlobal("fetch", fetcher);
    const { loadLocalSearch } = await import("./loadLocalSearch");
    const [first, second] = await Promise.all([
      loadLocalSearch(),
      loadLocalSearch(),
    ]);
    expect(first).toBe(second);
    expect(await loadLocalSearch()).toBe(first);
    expect(fetcher).toHaveBeenCalledExactlyOnceWith("/search-index.json");
  });
  it("allows retry after a failed initial download", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(new Response("unavailable", { status: 503 }))
        .mockResolvedValueOnce(new Response("[]"))
    );
    const { loadLocalSearch } = await import("./loadLocalSearch");
    await expect(loadLocalSearch()).rejects.toThrow("Search index unavailable");
    expect((await loadLocalSearch())("anything")).toEqual([]);
  });
});
