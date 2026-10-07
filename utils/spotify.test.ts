import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const response = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });
const item = {
  track: {
    name: "test track",
    artists: [{ name: "artist" }],
    album: { images: [{ url: "https://example.test/cover" }] },
    external_urls: { spotify: "https://example.test/song" },
  },
  played_at: "2026-10-07T00:00:00Z",
};
let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  vi.resetModules();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-07T00:00:00Z"));
  fetchMock = vi.fn(async (url: string) =>
    url.includes("/api/token")
      ? response({ access_token: "test-token", expires_in: 3600 })
      : response({ items: [item] })
  );
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
describe("Spotify caching", () => {
  it("shares simultaneous track and token requests", async () => {
    const { getRecentlyPlayed } = await import("./spotify");
    const results = await Promise.all(
      Array.from({ length: 20 }, () => getRecentlyPlayed(10))
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(results.every((result) => result === results[0])).toBe(true);
    expect(results[0].tracks[0].title).toBe("test track");
    expect(JSON.stringify(results[0])).not.toContain("test-token");
  });
  it("reuses tracks for five minutes then refreshes without renewing a valid token", async () => {
    const { getRecentlyPlayed } = await import("./spotify");
    await getRecentlyPlayed(10);
    vi.advanceTimersByTime(299999);
    await getRecentlyPlayed(10);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(1);
    await getRecentlyPlayed(10);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
  it("separates result limits while sharing a token refresh", async () => {
    const { getRecentlyPlayed } = await import("./spotify");
    await Promise.all([getRecentlyPlayed(5), getRecentlyPlayed(10)]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(
      fetchMock.mock.calls
        .map((call) => String(call[0]))
        .filter((url) => url.includes("/api/token"))
    ).toHaveLength(1);
  });
  it("renews tokens before expiry", async () => {
    const { getRecentlyPlayed } = await import("./spotify");
    await getRecentlyPlayed(10);
    vi.advanceTimersByTime(3540000);
    await getRecentlyPlayed(10);
    expect(
      fetchMock.mock.calls.filter((call) =>
        String(call[0]).includes("/api/token")
      )
    ).toHaveLength(2);
  });
  it("does not cache track failures or retain failed in-flight requests", async () => {
    fetchMock
      .mockResolvedValueOnce(
        response({ access_token: "test-token", expires_in: 3600 })
      )
      .mockResolvedValueOnce(response({ error: "unavailable" }, 503));
    const { getRecentlyPlayed } = await import("./spotify");
    await expect(getRecentlyPlayed(10)).rejects.toThrow(
      "recently-played failed"
    );
    await expect(getRecentlyPlayed(10)).resolves.toHaveProperty("tracks");
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
  it("allows recovery after token refresh failure", async () => {
    fetchMock.mockResolvedValueOnce(response({ error: "invalid_grant" }, 400));
    const { getRecentlyPlayed } = await import("./spotify");
    await expect(getRecentlyPlayed(10)).rejects.toThrow("token refresh failed");
    await expect(getRecentlyPlayed(10)).resolves.toHaveProperty("tracks");
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
  it("rejects invalid limits before upstream calls", async () => {
    const { getRecentlyPlayed } = await import("./spotify");
    for (const limit of [0, 51, NaN, Infinity, 1.5])
      await expect(getRecentlyPlayed(limit)).rejects.toThrow("Invalid");
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("sets success cache headers and prevents caching failures", async () => {
    const { GET } = await import("@/app/api/spotify/recently-played/route");
    const good = await GET();
    expect(good.headers.get("cache-control")).toContain("s-maxage=300");
    vi.advanceTimersByTime(300000);
    fetchMock.mockRejectedValueOnce(new Error("upstream failure"));
    const failed = await GET();
    expect(failed.status).toBe(502);
    expect(failed.headers.get("cache-control")).toBe("no-store");
    expect(await failed.json()).toEqual({ tracks: [] });
  });
});
