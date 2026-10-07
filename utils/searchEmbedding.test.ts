import { beforeEach, describe, expect, it, vi } from "vitest";

const embed = vi.hoisted(() => vi.fn());
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }));
vi.mock("./clients", () => ({ getVoyageClient: () => ({ embed }) }));
import { getSearchEmbedding } from "./searchEmbedding";
import { VOYAGE_MODEL } from "@/config/constants";

const vector = Array(1024).fill(0.1);
beforeEach(() => embed.mockReset());

describe("search embedding requests", () => {
  it("shares simultaneous requests for the same query", async () => {
    let resolve!: (data: unknown) => void;
    embed.mockReturnValue(
      new Promise((done) => {
        resolve = done;
      })
    );
    const calls = Array.from({ length: 5 }, () => getSearchEmbedding("faith"));
    expect(embed).toHaveBeenCalledOnce();
    expect(embed).toHaveBeenCalledWith(
      { model: VOYAGE_MODEL, input: "faith", inputType: "document" },
      { timeoutInSeconds: 10, maxRetries: 0 }
    );
    resolve({ data: [{ embedding: vector }] });
    expect(await Promise.all(calls)).toEqual(Array(5).fill(vector));
  });
  it("does not combine different queries", async () => {
    const secondVector = Array(1024).fill(0.2);
    embed
      .mockResolvedValueOnce({ data: [{ embedding: vector }] })
      .mockResolvedValueOnce({ data: [{ embedding: secondVector }] });
    expect(
      await Promise.all([
        getSearchEmbedding("faith"),
        getSearchEmbedding("book"),
      ])
    ).toEqual([vector, secondVector]);
    expect(embed).toHaveBeenCalledTimes(2);
  });
  it("allows a new request after a shared provider failure", async () => {
    embed
      .mockRejectedValueOnce(new Error("provider unavailable"))
      .mockResolvedValueOnce({ data: [{ embedding: vector }] });
    const failures = await Promise.allSettled([
      getSearchEmbedding("retry"),
      getSearchEmbedding("retry"),
    ]);
    expect(failures.map((result) => result.status)).toEqual([
      "rejected",
      "rejected",
    ]);
    expect(await getSearchEmbedding("retry")).toEqual(vector);
    expect(embed).toHaveBeenCalledTimes(2);
  });
  it("rejects malformed vectors before caching and permits a later retry", async () => {
    for (const embedding of [
      undefined,
      [],
      [0.1, 0.2],
      [...vector.slice(1), NaN],
    ]) {
      embed.mockResolvedValueOnce({ data: [{ embedding }] });
      await expect(getSearchEmbedding("invalid")).rejects.toThrow(
        "Invalid search embedding"
      );
    }
    embed.mockResolvedValueOnce({ data: [{ embedding: vector }] });
    expect(await getSearchEmbedding("invalid")).toEqual(vector);
  });
});
