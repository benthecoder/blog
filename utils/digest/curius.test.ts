import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { curius } from "./sources/curius";

const since = new Date("2026-01-01T00:00:00Z");
const until = new Date("2026-02-01T00:00:00Z");
const savedLink = {
  link: "https://example.com/article",
  title: "saved title",
  createdDate: "2026-01-15T00:00:00Z",
  highlights: [{ highlight: " passage ", comment: " my note " }],
};

beforeEach(() => {
  vi.useFakeTimers();
  // Native AbortSignal timers bypass fake timers. Keep cancellation semantics
  // while making the deadlines deterministic in these tests.
  vi.spyOn(AbortSignal, "timeout").mockImplementation((delay) => {
    const controller = new AbortController();
    setTimeout(
      () => controller.abort(new DOMException("Timed out", "TimeoutError")),
      delay
    );
    return controller.signal;
  });
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

function waitForAbort(signal: AbortSignal): Promise<never> {
  return new Promise((_, reject) => {
    signal.addEventListener("abort", () => reject(signal.reason), {
      once: true,
    });
  });
}

it("preserves pagination, date boundaries, highlights and notes", async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(
      Response.json({
        userSaved: [
          { ...savedLink, createdDate: until.toISOString() },
          savedLink,
        ],
      })
    )
    .mockResolvedValueOnce(
      Response.json({
        userSaved: [
          { ...savedLink, createdDate: since.toISOString() },
          { ...savedLink, createdDate: "2025-12-31T00:00:00Z" },
        ],
      })
    );
  vi.stubGlobal("fetch", fetcher);
  expect(await curius.fetch(since, until)).toEqual([
    {
      url: savedLink.link,
      title: savedLink.title,
      savedAt: new Date(savedLink.createdDate),
      highlights: ["passage"],
      take: "my note",
    },
    {
      url: savedLink.link,
      title: savedLink.title,
      savedAt: since,
      highlights: ["passage"],
      take: "my note",
    },
  ]);
  expect(fetcher.mock.calls.map(([url]) => url)).toEqual([
    "https://curius.app/api/users/2790/links?page=0",
    "https://curius.app/api/users/2790/links?page=1",
  ]);
});

it("cancels a stalled body and permits a later collection to recover", async () => {
  const fetcher = vi.fn(async (_url, options: RequestInit) => ({
    ok: true,
    json: (): Promise<unknown> => waitForAbort(options.signal!),
  }));
  vi.stubGlobal("fetch", fetcher);
  const operation = curius.fetch(since, until);
  const rejected = expect(operation).rejects.toMatchObject({
    name: "TimeoutError",
  });
  await vi.advanceTimersByTimeAsync(10_000);
  await rejected;
  fetcher.mockResolvedValueOnce(Response.json({ userSaved: [] }));
  expect(await curius.fetch(since, until)).toEqual([]);
});

it("limits the entire pagination run even when every page is below its deadline", async () => {
  const signals: AbortSignal[] = [];
  const fetcher = vi.fn(async (_url, options: RequestInit) => {
    const signal = options.signal!;
    signals.push(signal);
    await Promise.race([
      new Promise<void>((resolve) => setTimeout(resolve, 9_000)),
      waitForAbort(signal),
    ]);
    return Response.json({ userSaved: [savedLink] });
  });
  vi.stubGlobal("fetch", fetcher);
  const operation = curius.fetch(since, until);
  const rejected = expect(operation).rejects.toMatchObject({
    name: "TimeoutError",
  });
  await vi.advanceTimersByTimeAsync(30_000);
  await rejected;
  expect(fetcher).toHaveBeenCalledTimes(4);
  expect(signals[3].aborted).toBe(true);
});

it("cancels an upstream error body instead of retaining its connection", async () => {
  const cancel = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: false, status: 503, body: { cancel } })
  );
  await expect(curius.fetch(since, until)).rejects.toThrow("curius 503");
  expect(cancel).toHaveBeenCalledOnce();
});
