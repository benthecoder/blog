import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { sql } = vi.hoisted(() => ({ sql: vi.fn() }));
vi.mock("@neondatabase/serverless", () => ({ neon: () => sql }));
import { GET as thoughts } from "@/app/api/thoughts/route";
import { GET as bookmarks } from "@/app/api/curius/route";

beforeEach(() => vi.resetAllMocks());
afterEach(() => vi.unstubAllGlobals());
const readThoughts = (query = "") =>
  thoughts(new NextRequest(`https://example.test/api/thoughts${query}`));

describe("public feed cache boundaries", () => {
  it("returns the same thought rows with shared caching and bounded SQL pagination", async () => {
    const rows = [{ id: 9, content: "hello", created_at: "2026-10-07" }];
    sql.mockResolvedValue(rows);
    const response = await readThoughts("?cursor=10&limit=999");
    expect(await response.json()).toEqual(rows);
    expect(sql.mock.calls[0].slice(1)).toEqual([10, 200]);
    expect(sql.mock.calls[0][0].join("")).toContain("WHERE id <");
    expect(response.headers.get("cache-control")).toBe(
      "public, max-age=0, s-maxage=60, stale-while-revalidate=60"
    );
  });
  it("keeps default pagination and rejects invalid cursors before querying", async () => {
    sql.mockResolvedValue([]);
    await readThoughts();
    expect(sql.mock.calls[0].slice(1)).toEqual([100]);
    sql.mockClear();
    for (const cursor of ["", "-1", "1.5", "nope", "9007199254740992"]) {
      const response = await readThoughts(`?cursor=${cursor}`);
      expect(response.status).toBe(400);
      expect(response.headers.get("cache-control")).toBe("no-store");
    }
    expect(sql).not.toHaveBeenCalled();
  });
  it("does not cache database failures or expose provider errors", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    sql.mockRejectedValue(new Error("private database detail"));
    try {
      const response = await readThoughts();
      expect(response.status).toBe(500);
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(await response.json()).toEqual({
        error: "Failed to fetch thoughts",
      });
    } finally {
      log.mockRestore();
    }
  });
  it("caches successful Curius data while preserving its response shape", async () => {
    const data = {
      links: [
        {
          id: 1,
          title: "hello",
          link: "https://example.test",
          createdDate: "2026-10-07",
        },
      ],
    };
    const fetcher = vi.fn().mockResolvedValue(
      Response.json({
        links: data.links.map((link) => ({
          ...link,
          snippet: "large unused body",
          favorite: true,
          lastCrawled: "yesterday",
        })),
      })
    );
    vi.stubGlobal("fetch", fetcher);
    const response = await bookmarks();
    expect(await response.json()).toEqual({ data });
    expect(response.headers.get("cache-control")).toContain("s-maxage=3600");
    expect(fetcher).toHaveBeenCalledWith(
      "https://curius.app/api/users/2790/searchLinks",
      expect.objectContaining({
        cache: "no-store",
        signal: expect.any(AbortSignal),
      })
    );
  });
  it("does not cache Curius HTTP, network or malformed JSON failures", async () => {
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    for (const failure of [
      () =>
        Promise.resolve(
          new Response("private upstream detail", { status: 503 })
        ),
      () => Promise.reject(new Error("private connection detail")),
      () => Promise.resolve(new Response("not JSON")),
    ]) {
      fetcher.mockImplementation(failure);
      const response = await bookmarks();
      expect(response.status).toBe(502);
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(await response.json()).toEqual({
        error: "Failed to fetch bookmarks",
      });
    }
  });
});
