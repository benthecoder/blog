import { expect, it, vi } from "vitest";
import type { EmbedResponse } from "voyageai";
import type { ProcessedPost } from "@/types/chunks";
import { prepareEmbeddings } from "./prepareEmbeddings";
import { replaceEmbeddings, INSERT_EMBEDDINGS_SQL } from "./replaceEmbeddings";

const post: ProcessedPost = {
  filePath: "example",
  frontmatter: {
    title: "Example",
    date: "2026-10-07",
    tags: ["a,b", 'quote"', "back\\slash"],
  },
  chunks: [0, 1, 2].map((sequence) => ({
    type: "section",
    content: `Chunk ${sequence}`,
    metadata: { section: "Notes" },
    sequence,
  })),
};
const response = (texts: string[]): EmbedResponse => ({
  data: texts
    .map((_, index) => ({ index, embedding: Array(1024).fill(index + 1) }))
    .reverse(),
});
const prepare = (embed = vi.fn(async (texts: string[]) => response(texts))) =>
  prepareEmbeddings([post], embed, 2, async () => {});

it("maps reordered provider vectors to the correct chunks across batches", async () => {
  const embed = vi.fn(async (texts: string[]) => response(texts));
  const wait = vi.fn(async () => {});
  const rows = await prepareEmbeddings([post], embed, 2, wait);
  expect(embed.mock.calls.map(([texts]) => texts.length)).toEqual([2, 1]);
  expect(embed.mock.calls[0][0][0]).toBe("SECTION: [SECTION: Notes] Chunk 0");
  expect(rows.map((row) => JSON.parse(row.embedding)[0])).toEqual([1, 2, 1]);
  expect(rows.map((row) => row.sequence)).toEqual([0, 1, 2]);
  expect(rows[0].tags).toEqual(post.frontmatter.tags);
  expect(wait).toHaveBeenCalledTimes(1);
});

it.each([
  { data: [] },
  { data: [{ embedding: [1] }, { embedding: [1] }] },
  {
    data: [0, 1].map((index) => ({ index, embedding: Array(1024).fill(NaN) })),
  },
  { data: [0, 0].map((index) => ({ index, embedding: Array(1024).fill(1) })) },
  {
    data: [
      { index: 0, embedding: Array(1024).fill(1) },
      { embedding: Array(1024).fill(1) },
    ],
  },
] satisfies EmbedResponse[])(
  "rejects incomplete or invalid provider output before replacement",
  async (invalid) => {
    await expect(prepare(vi.fn(async () => invalid))).rejects.toThrow();
  }
);

it("rejects an unreadable or empty post before any provider call", async () => {
  const embed = vi.fn(async (texts: string[]) => response(texts));
  await expect(
    prepareEmbeddings(
      [post, { ...post, filePath: "empty", chunks: [] }],
      embed,
      120,
      async () => {}
    )
  ).rejects.toThrow("existing index preserved");
  expect(embed).not.toHaveBeenCalled();
});

it("does not replace anything when a later provider batch fails", async () => {
  const embed = vi.fn(async (texts: string[]) => response(texts));
  embed
    .mockImplementationOnce(async (texts) => response(texts))
    .mockRejectedValueOnce(new Error("Provider unavailable"));
  await expect(prepare(embed)).rejects.toThrow("Provider unavailable");
});

it("uses one transaction and bulk inserts, with parameters for the replacement scope", async () => {
  const rows = await prepare();
  const query = vi.fn<(text: string, values?: unknown[]) => Promise<unknown>>(
    async () => ({ rows: [] })
  );
  await replaceEmbeddings(
    { query },
    Array.from({ length: 121 }, (_, i) => ({ ...rows[0], sequence: i })),
    "example"
  );
  expect(query.mock.calls.map((call) => call[0])).toEqual([
    "BEGIN",
    "SELECT pg_advisory_xact_lock(hashtext('blog:content_chunks'))",
    "DELETE FROM content_chunks WHERE post_slug = $1",
    INSERT_EMBEDDINGS_SQL,
    INSERT_EMBEDDINGS_SQL,
    "COMMIT",
  ]);
  expect(query.mock.calls[2][1]).toEqual(["example"]);
});

it("rolls back deletion and earlier batches when a later insert fails", async () => {
  const rows = await prepare();
  const failure = new Error("Insert failed");
  const query = vi.fn<(text: string, values?: unknown[]) => Promise<unknown>>(
    async () => ({ rows: [] })
  );
  query
    .mockImplementationOnce(async () => ({ rows: [] }))
    .mockImplementationOnce(async () => ({ rows: [] }))
    .mockImplementationOnce(async () => ({ rows: [] }))
    .mockImplementationOnce(async () => ({ rows: [] }))
    .mockRejectedValueOnce(failure);
  await expect(
    replaceEmbeddings({ query }, Array(121).fill(rows[0]))
  ).rejects.toBe(failure);
  expect(query.mock.calls.at(-1)?.[0]).toBe("ROLLBACK");
  expect(query.mock.calls.some((call) => call[0] === "COMMIT")).toBe(false);
});

it("rejects an empty replacement or mismatched slug before opening a transaction", async () => {
  const query = vi.fn<(text: string, values?: unknown[]) => Promise<unknown>>(
    async () => ({ rows: [] })
  );
  await expect(replaceEmbeddings({ query }, [])).rejects.toThrow();
  await expect(
    replaceEmbeddings({ query }, await prepare(), "other")
  ).rejects.toThrow();
  expect(query).not.toHaveBeenCalled();
});
