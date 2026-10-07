import { afterEach, beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const fetcher = vi.fn();
beforeEach(() => {
  vi.resetModules();
  vi.resetAllMocks();
  vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://redis.example.test/");
  vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "test-only-token");
  vi.stubGlobal("fetch", fetcher);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

it("sends one uncached HTTP request and preserves pipeline result order", async () => {
  fetcher.mockResolvedValue(
    Response.json([{ result: ["2", null] }, { result: ["4"] }])
  );
  const { upstashPipeline } = await import("./upstash");
  const commands = [
    ["MGET", "a", "b"],
    ["MGET", "c"],
  ];
  expect(await upstashPipeline(commands)).toEqual([["2", null], ["4"]]);
  expect(fetcher).toHaveBeenCalledExactlyOnceWith(
    "https://redis.example.test/pipeline",
    expect.objectContaining({
      method: "POST",
      cache: "no-store",
      signal: expect.any(AbortSignal),
      body: JSON.stringify(commands),
    })
  );
});
it("rejects partial errors and truncated pipeline responses", async () => {
  const { upstashPipeline } = await import("./upstash");
  for (const data of [
    [{ result: 1 }, { error: "failed" }],
    [{ result: 1 }],
    { error: "failed" },
  ]) {
    fetcher.mockResolvedValue(Response.json(data));
    await expect(
      upstashPipeline([
        ["GET", "a"],
        ["GET", "b"],
      ])
    ).rejects.toThrow();
  }
});
it("does not call Redis for an empty pipeline or missing credentials", async () => {
  vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
  const { upstashPipeline, upstashRequest } = await import("./upstash");
  expect(await upstashPipeline([])).toEqual([]);
  await expect(upstashRequest(["GET", "a"])).rejects.toThrow("Missing Upstash");
  expect(fetcher).not.toHaveBeenCalled();
});
it("retains single-command results and rejects HTTP and Redis errors", async () => {
  const { upstashRequest } = await import("./upstash");
  fetcher.mockResolvedValue(Response.json({ result: 3 }));
  expect(await upstashRequest(["GET", "a"])).toBe(3);
  fetcher.mockResolvedValue(
    new Response("private provider body", { status: 503 })
  );
  await expect(upstashRequest(["GET", "a"])).rejects.toThrow(
    "Upstash request failed"
  );
  fetcher.mockResolvedValue(Response.json({ error: "Redis failure" }));
  await expect(upstashRequest(["GET", "a"])).rejects.toThrow("Redis failure");
});
