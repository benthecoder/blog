import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchHackerNewsPage } from "./hackerNews";

const mockFetch = vi.fn();
const json = (value: unknown) => Response.json(value);

afterEach(() => {
  vi.unstubAllGlobals();
  mockFetch.mockReset();
});

describe("fetchHackerNewsPage", () => {
  it("fetches only the selected 50 stories and preserves their ranking", async () => {
    vi.stubGlobal("fetch", mockFetch);
    const ids = Array.from({ length: 120 }, (_, i) => i + 1);
    mockFetch.mockImplementation((url: string) => {
      if (url.endsWith("topstories.json")) return Promise.resolve(json(ids));
      const id = Number(/item\/(\d+)/.exec(url)?.[1]);
      return Promise.resolve(json({ id, title: `Story ${id}` }));
    });
    const stories = await fetchHackerNewsPage(1);
    expect(stories.map((story) => story.id)).toEqual(ids.slice(50, 100));
    expect(stories[0].url).toBe("https://news.ycombinator.com/item?id=51");
    expect(mockFetch).toHaveBeenCalledTimes(51);
    expect(mockFetch.mock.calls.every(([, options]) => options.signal)).toBe(
      true
    );
  });

  it("skips unavailable stories without failing the whole page", async () => {
    vi.stubGlobal("fetch", mockFetch);
    mockFetch
      .mockResolvedValueOnce(json([1, 2, 3, 4]))
      .mockResolvedValueOnce(json(null))
      .mockResolvedValueOnce(json({ id: 2, deleted: true }))
      .mockResolvedValueOnce(json({ id: 3, dead: true }))
      .mockResolvedValueOnce(
        json({
          id: 4,
          title: "Four",
          url: "https://example.com",
          descendants: 2,
        })
      );
    expect(await fetchHackerNewsPage(0)).toEqual([
      { id: 4, title: "Four", url: "https://example.com", descendants: 2 },
    ]);
  });

  it("rejects HTTP errors and invalid IDs before requesting stories", async () => {
    vi.stubGlobal("fetch", mockFetch);
    mockFetch.mockResolvedValueOnce(
      new Response("Unavailable", { status: 503 })
    );
    await expect(fetchHackerNewsPage(0)).rejects.toThrow("503");
    mockFetch.mockResolvedValueOnce(json(["../../private"]));
    await expect(fetchHackerNewsPage(0)).rejects.toThrow("story ID");
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("rejects malformed or mismatched story records", async () => {
    vi.stubGlobal("fetch", mockFetch);
    mockFetch
      .mockResolvedValueOnce(json([1]))
      .mockResolvedValueOnce(json({ id: 2, title: "Wrong" }));
    await expect(fetchHackerNewsPage(0)).rejects.toThrow(
      "Invalid Hacker News story"
    );
  });

  it("rejects invalid pages without fetching", async () => {
    vi.stubGlobal("fetch", mockFetch);
    for (const page of [-1, 10, 0.5, NaN]) {
      await expect(fetchHackerNewsPage(page)).rejects.toThrow(
        "Invalid Hacker News page"
      );
    }
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
