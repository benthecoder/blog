import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import type { LinkItem } from "./types";
import { resolveLinkTitles } from "@/scripts/lib/linkTitles";
const sql = vi.hoisted(() => vi.fn());
vi.mock("@neondatabase/serverless", () => ({ neon: () => sql }));
const item = (url: string): LinkItem => ({
  url,
  title: url,
  savedAt: new Date("2026-10-01"),
  highlights: [],
  sources: ["tweets"],
});
beforeEach(() => sql.mockReset());
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("local draft title fetching", () => {
  it("deduplicates requests, keeps order, and keeps four workers busy", async () => {
    let active = 0,
      peak = 0;
    const pending = new Map<string, () => void>();
    const fetchMock = vi.fn(
      (url: string) =>
        new Promise<Response>((resolve) => {
          active++;
          peak = Math.max(peak, active);
          pending.set(url, () => {
            pending.delete(url);
            active--;
            resolve(new Response(`<title>${url} title</title>`));
          });
        })
    );
    vi.stubGlobal("fetch", fetchMock);
    const links = Array.from({ length: 6 }, (_, i) =>
      item(`https://example.test/${i}`)
    );
    links.push({ ...links[0], take: "another take" });
    links.push({
      ...item("https://example.test/stored"),
      title: "stored title",
    });
    links.push({ ...item("https://example.test/curius"), sources: ["curius"] });
    const operation = resolveLinkTitles(links);
    expect(pending.size).toBe(4);
    pending.get(links[0].url)!();
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(5));
    pending.get(links[4].url)!();
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(6));
    for (const release of pending.values()) release();
    const result = await operation;
    expect(peak).toBe(4);
    expect(result.map((link) => link.url)).toEqual(
      links.map((link) => link.url)
    );
    expect(result[0].title).toBe(`${links[0].url} title`);
    expect(result[6].title).toBe(result[0].title);
    expect(result[6].take).toBe("another take");
    expect(result[7]).toBe(links[7]);
    expect(result[8]).toBe(links[8]);
  });

  it("bounds raw bytes even when one chunk exceeds the limit", async () => {
    const cancel = vi.fn();
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            new ReadableStream({
              start(controller) {
                controller.enqueue(
                  new TextEncoder().encode(
                    "é".repeat(100_001) + "<title>too late</title>"
                  )
                );
              },
              cancel,
            })
          )
      )
    );
    const link = item("https://example.test/large");
    expect((await resolveLinkTitles([link]))[0].title).toBe(link.url);
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it("decodes split UTF-8 and cancels after finding the title", async () => {
    const cancel = vi.fn();
    const bytes = new TextEncoder().encode("<title>café</title>");
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            new ReadableStream({
              start(controller) {
                controller.enqueue(bytes.subarray(0, 11));
                controller.enqueue(bytes.subarray(11));
              },
              cancel,
            })
          )
      )
    );
    expect(
      (await resolveLinkTitles([item("https://example.test/unicode")]))[0].title
    ).toBe("café");
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it("does not follow redirects and keeps URL fallback on failed lookups", async () => {
    const cancel = vi.fn();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(new ReadableStream({ cancel }), {
          status: 302,
          headers: { location: "http://localhost/" },
        })
      )
      .mockRejectedValueOnce(new DOMException("timed out", "TimeoutError"));
    vi.stubGlobal("fetch", fetchMock);
    const links = [
      item("https://example.test/redirect"),
      item("https://example.test/timeout"),
    ];
    expect((await resolveLinkTitles(links)).map((link) => link.title)).toEqual(
      links.map((link) => link.url)
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][1].redirect).toBe("manual");
    expect(cancel).toHaveBeenCalledTimes(1);
  });
});

describe("server source collection", () => {
  it("preserves stored titles, URL fallbacks, order and takes without fetching URLs", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    sql.mockResolvedValue([
      {
        content: " take ",
        link: "https://example.test/one",
        link_title: null,
        created_at: "2026-10-01",
      },
      {
        content: "",
        link: "https://example.test/two",
        link_title: "stored",
        created_at: "2026-10-02",
      },
    ]);
    const { tweets } = await import("./sources/tweets");
    const result = await tweets.fetch(
      new Date("2026-10-01"),
      new Date("2026-10-04")
    );
    expect(result.map((link) => link.title)).toEqual([
      "https://example.test/one",
      "stored",
    ]);
    expect(result[0].take).toBe("take");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("the actual period-template handler fetches only its fixed Curius source", async () => {
    vi.stubEnv("NODE_ENV", "test");
    sql.mockResolvedValue([
      {
        content: "take",
        link: "https://saved-link.example/private",
        link_title: null,
        created_at: "2026-10-01",
      },
    ]);
    const fetchMock = vi.fn(async (url: string) => {
      expect(url).toMatch(
        /^https:\/\/curius\.app\/api\/users\/2790\/links\?page=\d+$/
      );
      return new Response(JSON.stringify({ userSaved: [] }));
    });
    vi.stubGlobal("fetch", fetchMock);
    const { GET } = await import("@/app/api/admin/period-template/route");
    const response = await GET(
      new NextRequest(
        "http://localhost/api/admin/period-template?kind=weekly&date=2026-10-04"
      )
    );
    expect(response.status).toBe(200);
    expect((await response.json()).body).toContain(
      "https://saved-link.example/private"
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
