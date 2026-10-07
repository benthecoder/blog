import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/utils/upstash", () => ({
  upstashRequest: vi.fn(),
  upstashPipeline: vi.fn(),
}));
vi.mock("@/utils/content/posts", () => ({ getPostSlugs: vi.fn() }));
import { GET, POST } from "@/app/api/views/route";
import { upstashRequest, upstashPipeline } from "@/utils/upstash";
import { COUNT_VIEW_SCRIPT } from "@/utils/viewCounter";
import { getPostSlugs } from "@/utils/content/posts";

const redis = vi.mocked(upstashRequest);
const pipeline = vi.mocked(upstashPipeline);
const slugs = vi.mocked(getPostSlugs);
const read = (query = "") =>
  GET(new NextRequest(`https://example.test/api/views${query}`));
const write = (body: string) =>
  POST(
    new NextRequest("https://example.test/api/views", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "192.0.2.1",
      },
      body,
    })
  );

beforeEach(() => {
  vi.resetAllMocks();
  slugs.mockReturnValue(["journal", "日記"]);
});

describe("published view counters", () => {
  it("rejects malformed bodies before Redis", async () => {
    for (const body of [
      "null",
      "[]",
      "{",
      '"journal"',
      '{"slug":4}',
      '{"slug":"../draft"}',
      JSON.stringify({ slug: "x".repeat(256) }),
    ]) {
      expect((await write(body)).status).toBe(400);
    }
    expect(redis).not.toHaveBeenCalled();
  });
  it("does not create counters for nonexistent or draft-only names", async () => {
    expect((await write('{"slug":"not-published"}')).status).toBe(404);
    expect((await read("?slug=not-published")).status).toBe(404);
    expect(redis).not.toHaveBeenCalled();
  });
  it("does not turn invalid slug reads into leaderboard scans", async () => {
    for (const query of ["?slug=", "?slug=%20", "?slug=..%2Fjournal"]) {
      expect((await read(query)).status).toBe(400);
    }
    expect(redis).not.toHaveBeenCalled();
  });
  it("retains Unicode counter names and short read caching", async () => {
    redis.mockResolvedValue("12");
    const response = await read(`?slug=${encodeURIComponent("日記")}`);
    expect(await response.json()).toEqual({ slug: "日記", count: 12 });
    expect(redis).toHaveBeenCalledExactlyOnceWith(["GET", "views:日記"]);
    expect(response.headers.get("cache-control")).toContain("s-maxage=60");
  });
  it("counts through a single atomic command with unchanged keys and deduplication", async () => {
    redis.mockResolvedValue(13);
    const response = await write('{"slug":"journal"}');
    expect(await response.json()).toEqual({ slug: "journal", count: 13 });
    expect(redis).toHaveBeenCalledExactlyOnceWith([
      "EVAL",
      COUNT_VIEW_SCRIPT,
      2,
      "views:journal",
      expect.stringMatching(/^viewdedupe:journal:[a-f0-9]{64}$/),
      86400,
    ]);
  });
  it("returns the existing count supplied by Redis for a repeated viewer", async () => {
    redis.mockResolvedValue("13");
    expect(await (await write('{"slug":"journal"}')).json()).toEqual({
      slug: "journal",
      count: 13,
    });
    expect(redis).toHaveBeenCalledTimes(1);
  });
  it("bounds the leaderboard by published posts rather than Redis keyspace", async () => {
    const published = Array.from({ length: 401 }, (_, i) => `post-${i}`);
    slugs.mockReturnValue(published);
    pipeline.mockImplementation(async (commands) =>
      commands.map((command) =>
        command.slice(1).map((key) => (key === "views:post-400" ? "20" : null))
      )
    );
    const response = await read();
    const { results } = await response.json();
    expect(results).toHaveLength(401);
    expect(pipeline).toHaveBeenCalledTimes(1);
    expect(redis).not.toHaveBeenCalled();
    expect(results[0]).toEqual({ slug: "post-400", count: 20 });
    expect(
      pipeline.mock.calls[0][0].map((command) => command.length - 1)
    ).toEqual([200, 200, 1]);
    expect(
      pipeline.mock.calls[0][0].flatMap((command) => command.slice(1))
    ).toEqual(published.map((slug) => `views:${slug}`));
    expect(
      pipeline.mock.calls[0][0].every((command) => command[0] === "MGET")
    ).toBe(true);
    expect(response.headers.get("cache-control")).toContain("s-maxage=3600");
  });
  it("handles an empty published archive without Redis", async () => {
    slugs.mockReturnValue([]);
    pipeline.mockResolvedValue([]);
    expect(await (await read()).json()).toEqual({ results: [] });
    expect(redis).not.toHaveBeenCalled();
  });
  it("returns a generic uncached error when Redis fails", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    redis.mockRejectedValue(new Error("private upstream detail"));
    try {
      const response = await read("?slug=journal");
      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({
        error: "Failed to fetch post views",
      });
      expect(response.headers.get("cache-control")).toBeNull();
    } finally {
      log.mockRestore();
    }
  });
});
