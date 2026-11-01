import { describe, expect, it } from "vitest";
import { parseRows, thoughtRowSchema, tweetRowSchema } from "./thoughts";

// Shaped like a real Neon row: timestamptz arrives as a Date.
const row = {
  id: 1041,
  content: "hello",
  link: null,
  link_title: null,
  created_at: new Date("2026-10-31T12:00:00Z"),
};

describe("tweets rows", () => {
  it("accepts rows as the Neon driver returns them", () => {
    expect(parseRows(tweetRowSchema, [row], "tweets")).toEqual([row]);
    expect(parseRows(thoughtRowSchema, [row], "thoughts")[0]).toMatchObject({
      link: null,
      link_title: null,
    });
  });

  it("names the query and the field when the shape drifts", () => {
    expect(() =>
      parseRows(
        tweetRowSchema,
        [{ ...row, created_at: "2026-10-31" }],
        "tweets"
      )
    ).toThrow(/^tweets: unexpected row shape\n[\s\S]*created_at/);
  });
});
