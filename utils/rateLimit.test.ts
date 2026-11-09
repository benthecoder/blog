import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ pipeline: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/utils/upstash", () => ({ upstashPipeline: mocks.pipeline }));
import {
  checkRateLimit,
  rateLimitKey,
  retryAfterSeconds,
} from "@/utils/rateLimit";

const opts = { scope: "search", viewer: "abc", limit: 3, windowSeconds: 60 };

describe("window math", () => {
  it("keys by window index", () => {
    expect(rateLimitKey("search", "abc", 120_000, 60)).toBe(
      "ratelimit:search:abc:2"
    );
    expect(rateLimitKey("search", "abc", 179_999, 60)).toBe(
      "ratelimit:search:abc:2"
    );
    expect(rateLimitKey("search", "abc", 180_000, 60)).toBe(
      "ratelimit:search:abc:3"
    );
  });
  it("computes seconds until the window resets", () => {
    expect(retryAfterSeconds(120_000, 60)).toBe(60);
    expect(retryAfterSeconds(150_000, 60)).toBe(30);
    expect(retryAfterSeconds(179_999, 60)).toBe(1);
  });
});

describe("checkRateLimit", () => {
  beforeEach(() => mocks.pipeline.mockReset());

  it("allows up to the limit and blocks beyond it", async () => {
    mocks.pipeline.mockResolvedValueOnce([3, 1]);
    expect((await checkRateLimit(opts)).ok).toBe(true);
    mocks.pipeline.mockResolvedValueOnce([4, 0]);
    const blocked = await checkRateLimit(opts);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
  });
  it("sends INCR and EXPIRE NX in one pipeline", async () => {
    mocks.pipeline.mockResolvedValueOnce([1, 1]);
    await checkRateLimit(opts);
    const [commands] = mocks.pipeline.mock.calls[0];
    expect(commands[0][0]).toBe("INCR");
    expect(commands[1]).toEqual(["EXPIRE", commands[0][1], 60, "NX"]);
  });
  it("fails open when Upstash throws", async () => {
    mocks.pipeline.mockRejectedValueOnce(new Error("down"));
    expect((await checkRateLimit(opts)).ok).toBe(true);
  });
  it("fails closed for credential routes when Redis fails", async () => {
    mocks.pipeline.mockRejectedValueOnce(new Error("down"));
    expect((await checkRateLimit({ ...opts, failOpen: false })).ok).toBe(false);
  });
  it("fails open when Upstash is slow", async () => {
    vi.useFakeTimers();
    mocks.pipeline.mockReturnValueOnce(new Promise(() => {}));
    const pending = checkRateLimit(opts);
    await vi.advanceTimersByTimeAsync(501);
    expect((await pending).ok).toBe(true);
    vi.useRealTimers();
  });
});
