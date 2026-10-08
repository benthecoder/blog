import { describe, expect, it, vi } from "vitest";
import { fetchThoughtPage } from "./thoughtsPage";
const signal = new AbortController().signal;
const thought = (id: number) => ({
  id,
  content: "hello",
  created_at: "2026-10-07T00:00:00Z",
});

describe("thoughts pagination", () => {
  it("accepts older rows and an empty final page, forwarding cancellation", async () => {
    const page = [thought(9), thought(8)];
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json(page))
      .mockResolvedValueOnce(Response.json([]));
    expect(await fetchThoughtPage(10, signal, fetcher)).toEqual(page);
    expect(fetcher).toHaveBeenCalledWith("/api/thoughts?cursor=10&limit=100", {
      signal,
    });
    expect(await fetchThoughtPage(8, signal, fetcher)).toEqual([]);
  });
  it("rejects server errors instead of treating them as the end of the stream", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        Response.json({ error: "database unavailable" }, { status: 500 })
      );
    await expect(fetchThoughtPage(10, signal, fetcher)).rejects.toThrow(
      "Thoughts request failed (500)"
    );
  });
  it("rejects malformed or non-advancing pages before appending them", async () => {
    for (const data of [
      null,
      {},
      [thought(1000)],
      [thought(9), thought(9)],
      [thought(8), thought(9)],
      [thought(0)],
      [{ ...thought(9), content: null }],
      [{ ...thought(9), created_at: "invalid" }],
      Array.from({ length: 101 }, (_, i) => thought(999 - i)),
    ]) {
      const fetcher = vi
        .fn<typeof fetch>()
        .mockResolvedValue(Response.json(data));
      await expect(fetchThoughtPage(1000, signal, fetcher)).rejects.toThrow(
        "Invalid thoughts page"
      );
    }
  });
  it("rejects invalid cursors before sending requests", async () => {
    const fetcher = vi.fn<typeof fetch>();
    for (const cursor of [0, -1, NaN, Infinity, 1.5])
      await expect(fetchThoughtPage(cursor, signal, fetcher)).rejects.toThrow(
        "Invalid thoughts cursor"
      );
    expect(fetcher).not.toHaveBeenCalled();
  });
});
