import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  query: vi.fn(),
  embed: vi.fn(),
  client: vi.fn(),
}));
vi.mock("@neondatabase/serverless", () => ({
  neon: () => ({ query: mocks.query }),
}));
vi.mock("@/utils/clients", () => ({ getVoyageClient: mocks.client }));
vi.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }));
vi.mock("server-only", () => ({}));
import { POST } from "@/app/api/search/route";

const row = {
  content: "A note about jazz",
  post_slug: "jazz",
  post_title: "Jazz",
  chunk_type: "section",
  metadata: { tags: ["music"], section: "Practice" },
  keyword_score: 0.8,
  hybrid_score: 0.7,
  vector_similarity: 0.9,
  text_rank: 0.4,
};
function request(body: unknown) {
  return new Request("http://localhost/api/search", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.query.mockReset().mockResolvedValue([row]);
  mocks.embed
    .mockReset()
    .mockResolvedValue({ data: [{ embedding: Array(1024).fill(0.1) }] });
  mocks.client.mockImplementation(() => ({ embed: mocks.embed }));
});

describe("search request boundary", () => {
  it.each([
    null,
    [],
    {},
    { query: 12 },
    { query: "   " },
    { query: "a".repeat(2001) },
    { query: "jazz", searchType: "other" },
    { query: "jazz", searchType: {} },
    { query: "jazz", tags: "music" },
    { query: "jazz", tags: [null] },
    { query: "jazz", tags: [""] },
    { query: "jazz", tags: ["a".repeat(100)] },
    { query: "jazz", tags: Array(21).fill("music") },
    { query: "jazz", chunkType: "section' OR TRUE" },
  ])("rejects invalid input before external services: %j", async (body) => {
    expect((await POST(request(body))).status).toBe(400);
    expect(mocks.query).not.toHaveBeenCalled();
    expect(mocks.client).not.toHaveBeenCalled();
  });
  it("rejects oversized tag arrays before reading their elements", async () => {
    const tags = Array.from({ length: 21 });
    Object.defineProperty(tags, "0", {
      get() {
        throw new Error("Oversized arrays must not be traversed");
      },
    });
    const input = request({ query: "jazz" });
    vi.spyOn(input, "json").mockResolvedValue({ query: "jazz", tags });
    const response = await POST(input);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Tags must be up to 20 strings of 1–99 characters",
    });
    expect(mocks.query).not.toHaveBeenCalled();
    expect(mocks.client).not.toHaveBeenCalled();
  });
  it("rejects malformed JSON", async () => {
    expect(
      (
        await POST(
          new Request("http://localhost/api/search", {
            method: "POST",
            body: "{",
          })
        )
      ).status
    ).toBe(400);
    expect(mocks.query).not.toHaveBeenCalled();
  });
  it("does not invoke SQL for a keyword query containing only operators", async () => {
    const response = await POST(
      request({ query: "& | ! () : *", searchType: "keyword" })
    );
    expect(await response.json()).toEqual({ results: [] });
    expect(mocks.query).not.toHaveBeenCalled();
    expect(mocks.client).not.toHaveBeenCalled();
  });
});

describe("parameterized search filters", () => {
  const tags = ["music", "O'Reilly'); DROP TABLE content_chunks; --"];
  it.each(["keyword", "hybrid", "semantic"])(
    "binds literal tags and chunk type in %s search",
    async (searchType) => {
      const response = await POST(
        request({ query: "jazz piano", searchType, tags, chunkType: "section" })
      );
      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.results[0]).toMatchObject({
        post_slug: "jazz",
        tags: ["music"],
        score_type: searchType,
      });
      const [statement, parameters] = mocks.query.mock.calls[0];
      expect(statement).not.toContain(tags[1]);
      expect(statement).not.toContain("jazz piano");
      expect(statement).toContain("jsonb_array_elements_text");
      expect(parameters.slice(-2)).toEqual([JSON.stringify(tags), "section"]);
      if (searchType === "keyword") expect(mocks.client).not.toHaveBeenCalled();
      else expect(mocks.embed).toHaveBeenCalledOnce();
    }
  );
  it.each(["hybrid", "semantic"])(
    "keeps filters in %s fallback results",
    async (searchType) => {
      mocks.query.mockResolvedValueOnce([]).mockResolvedValueOnce([row]);
      const response = await POST(
        request({ query: "jazz", searchType, tags, chunkType: "quote" })
      );
      expect((await response.json()).fallback).toBe(true);
      expect(mocks.query).toHaveBeenCalledTimes(2);
      for (const [statement, parameters] of mocks.query.mock.calls) {
        expect(statement).not.toContain(tags[1]);
        expect(parameters.slice(-2)).toEqual([JSON.stringify(tags), "quote"]);
      }
    }
  );
  it.each(["keyword", "hybrid", "semantic"])(
    "uses unfiltered values when %s filters are omitted",
    async (searchType) => {
      await POST(request({ query: "jazz", searchType }));
      expect(mocks.query.mock.calls[0][1].slice(-2)).toEqual(["[]", null]);
    }
  );
  it("defaults to hybrid", async () => {
    const response = await POST(request({ query: "jazz" }));
    expect((await response.json()).results[0].score_type).toBe("hybrid");
  });
  it("reports missing embeddings without querying the database", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.embed.mockResolvedValue({ data: [] });
    try {
      expect((await POST(request({ query: "jazz" }))).status).toBe(500);
      expect(mocks.query).not.toHaveBeenCalled();
    } finally {
      log.mockRestore();
    }
  });
  it("does not expose database errors to visitors", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      mocks.query.mockRejectedValue(new Error("private connection details"));
      const response = await POST(
        request({ query: "jazz", searchType: "keyword" })
      );
      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({
        error: "Search is temporarily unavailable",
      });
    } finally {
      log.mockRestore();
    }
  });
});
