import { describe, expect, it, vi, afterEach } from "vitest";
import { fetchTitle } from "./fetchTitle";

afterEach(() => vi.unstubAllGlobals());

describe("fetchTitle", () => {
  it("follows a public redirect and reads the destination title", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(null, {
          status: 302,
          headers: { location: "https://example.com/final" },
        })
      )
      .mockResolvedValueOnce(new Response("<title>Final title</title>"));
    expect(await fetchTitle("https://example.com/start", fetcher)).toBe(
      "Final title"
    );
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls[1][0]).toBe("https://example.com/final");
  });

  it("does not follow a redirect onto a local host", async () => {
    const cancel = vi.fn();
    const fetcher = vi.fn().mockResolvedValue(
      new Response(new ReadableStream({ cancel }), {
        status: 302,
        headers: { location: "http://localhost/" },
      })
    );
    expect(await fetchTitle("https://example.com/start", fetcher)).toBeNull();
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(cancel).toHaveBeenCalledTimes(1);
  });
});
