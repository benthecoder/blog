import { afterEach, describe, expect, it, vi } from "vitest";
import { LatestSearch } from "./latestSearch";

const input = { query: "old", searchType: "keyword" as const };
const result = {
  post_slug: "post",
  post_title: "Post",
  content: "Text",
  chunk_type: "section",
  score_type: "keyword",
  similarity: 1,
  tags: [],
};
const response = () => new Response(JSON.stringify({ results: [result] }));
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
afterEach(() => vi.unstubAllGlobals());

describe("latest search response", () => {
  it("ignores an old success even when fetch ignores cancellation", async () => {
    const old = deferred<Response>();
    const fetcher = vi
      .fn()
      .mockReturnValueOnce(old.promise)
      .mockResolvedValueOnce(response());
    vi.stubGlobal("fetch", fetcher);
    const search = new LatestSearch();
    const first = search.run(input);
    const second = await search.run({
      ...input,
      query: "new",
      chunkType: "code",
    });
    expect(fetcher.mock.calls[0][1].signal.aborted).toBe(true);
    expect(second?.results).toEqual([result]);
    old.resolve(response());
    expect(await first).toBeNull();
    expect(JSON.parse(fetcher.mock.calls[1][1].body)).toEqual({
      query: "new",
      searchType: "keyword",
      chunkType: "code",
    });
  });
  it("ignores an obsolete failure", async () => {
    const old = deferred<Response>();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockReturnValueOnce(old.promise).mockResolvedValueOnce(response())
    );
    const search = new LatestSearch();
    const first = search.run(input);
    expect((await search.run(input))?.error).toBe("");
    old.reject(new Error("Offline"));
    expect(await first).toBeNull();
  });
  it("discard results after clearing or closing, including during JSON parsing", async () => {
    const body = deferred<unknown>();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: () => body.promise })
    );
    const search = new LatestSearch();
    const pending = search.run(input);
    await Promise.resolve();
    search.cancel();
    body.resolve({ results: [result] });
    expect(await pending).toBeNull();
  });
  it.each([
    new Response("no", { status: 500 }),
    new Response("not JSON"),
    new Response(JSON.stringify({ results: [{ post_slug: "broken" }] })),
  ])("reports failures separately from empty results", async (response) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));
    expect(await new LatestSearch().run(input)).toEqual({
      results: [],
      error: "Search unavailable. Try again.",
    });
  });
  it("accepts a successful empty result", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ results: [] })))
    );
    expect(await new LatestSearch().run(input)).toEqual({
      results: [],
      error: "",
    });
  });
});
