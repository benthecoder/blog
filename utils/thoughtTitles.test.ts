import { afterEach, describe, expect, it, vi } from "vitest";
import { clearTitleCache, resolveThoughtTitles } from "./thoughtTitles";
import type { ThoughtRow } from "./thoughts";

afterEach(() => {
  clearTitleCache();
  vi.unstubAllGlobals();
});

const row = (over: Partial<ThoughtRow> = {}): ThoughtRow => ({
  id: 1,
  content: "a note",
  link: "https://example.com/post",
  link_title: null,
  created_at: new Date("2026-11-26T17:02:00Z"),
  ...over,
});

describe("resolveThoughtTitles", () => {
  it("uses a stored title and does not fetch", async () => {
    const fetcher = vi.fn();
    const persist = vi.fn();
    const result = await resolveThoughtTitles(
      [row({ link_title: "Stored title" })],
      { fetcher, persist }
    );
    expect(fetcher).not.toHaveBeenCalled();
    expect(persist).not.toHaveBeenCalled();
    expect(result[0].titles).toEqual({
      "https://example.com/post": "Stored title",
    });
    expect(result[0].link).toBe("https://example.com/post");
  });

  it("fetches missing titles once, persists them, and reuses the cache", async () => {
    const fetcher = vi.fn(
      async () => new Response("<title>Fetched title</title>")
    );
    const persist = vi.fn(async () => {});
    const first = await resolveThoughtTitles([row()], { fetcher, persist });
    expect(first[0].titles["https://example.com/post"]).toBe("Fetched title");
    expect(persist).toHaveBeenCalledWith(
      "https://example.com/post",
      "Fetched title"
    );
    const second = await resolveThoughtTitles([row()], {
      fetcher,
      persist,
    });
    expect(second[0].titles["https://example.com/post"]).toBe("Fetched title");
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(persist).toHaveBeenCalledTimes(1);
  });

  it("fetches bare URLs in the body and leaves labeled markdown links alone", async () => {
    const fetcher = vi.fn<typeof fetch>(async (input) => {
      const href = input instanceof Request ? input.url : String(input);
      const path = new URL(href).pathname;
      return new Response(`<title>${path} title</title>`);
    });
    const result = await resolveThoughtTitles(
      [
        row({
          content:
            "See https://example.com/bare and [kept](https://example.com/labeled)",
          link: null,
        }),
      ],
      { fetcher }
    );
    expect(result[0].titles).toEqual({
      "https://example.com/bare": "/bare title",
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0][0]).toBe("https://example.com/bare");
  });

  it("falls back silently when a fetch fails, without persisting", async () => {
    const fetcher = vi.fn(async () => new Response("", { status: 403 }));
    const persist = vi.fn();
    const result = await resolveThoughtTitles([row()], { fetcher, persist });
    expect(result[0].titles).toEqual({});
    expect(persist).not.toHaveBeenCalled();
  });
});
