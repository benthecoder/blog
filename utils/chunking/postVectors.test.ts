import { describe, expect, it } from "vitest";
import {
  buildPostVectors,
  centerAndNormalize,
  isContentChunk,
  removeDirection,
  scaffoldRatio,
  stripScaffolding,
} from "./postVectors";

const prose =
  "i spent the afternoon reading about how vector databases index high dimensional data and why approximate search beats exact search at scale.";
const template =
  "mood: 3/5\n\nwake: 9:00\nsleep: 1:00\n\nmeals:\n- breakfast: eggs\n- lunch: rice\n\ngrateful for: friends";

describe("template filtering", () => {
  it("strips daily-log scaffolding but keeps prose", () => {
    const out = stripScaffolding(`${prose}\n\n---\n\n${template}`);
    expect(out).toBe(prose);
  });

  it("measures how much of a chunk is scaffolding", () => {
    expect(scaffoldRatio(template)).toBeGreaterThan(0.9);
    expect(scaffoldRatio(prose)).toBe(0);
  });

  it("keeps long prose sections and drops quotes, code, short and template chunks", () => {
    expect(isContentChunk({ chunkType: "section", content: prose })).toBe(true);
    expect(isContentChunk({ chunkType: "quote", content: prose })).toBe(false);
    expect(isContentChunk({ chunkType: "code", content: prose })).toBe(false);
    expect(isContentChunk({ chunkType: "section", content: "short" })).toBe(
      false
    );
    expect(isContentChunk({ chunkType: "section", content: template })).toBe(
      false
    );
  });
});

describe("buildPostVectors", () => {
  const chunk = (
    postSlug: string,
    chunkType: string,
    embedding: number[],
    content = prose
  ) => ({ postSlug, chunkType, content, embedding });

  it("averages content sections and prefers them to the full post", () => {
    const [v] = buildPostVectors([
      chunk("a", "full-post", [9, 9]),
      chunk("a", "section", [1, 0]),
      chunk("a", "section", [0, 1]),
      chunk("a", "quote", [5, 5]),
    ]);
    expect(v.source).toBe("section");
    expect(v.vector).toEqual([0.5, 0.5]);
  });

  it("falls back to the full post when sections are unusable", () => {
    const [v] = buildPostVectors([
      chunk("a", "full-post", [2, 3]),
      chunk("a", "section", [1, 0], "tiny"),
      chunk("a", "code", [5, 5]),
    ]);
    expect(v).toMatchObject({ source: "full-post", vector: [2, 3] });
  });

  it("gives every post with a full-post chunk exactly one vector", () => {
    const out = buildPostVectors([
      chunk("a", "full-post", [1, 0]),
      chunk("b", "full-post", [0, 1]),
      chunk("c", "quote", [1, 1]),
    ]);
    expect(out.map((p) => p.postSlug).sort()).toEqual(["a", "b"]);
  });
});

describe("centering", () => {
  it("removes the shared direction and unit-normalizes", () => {
    const out = centerAndNormalize([
      [10, 1],
      [10, -1],
    ]);
    expect(out[0][0]).toBeCloseTo(0);
    out.forEach((v) => expect(Math.hypot(...v)).toBeCloseTo(1));
    expect(out[0][1]).toBeCloseTo(1);
    expect(out[1][1]).toBeCloseTo(-1);
  });

  it("projects a direction out of every vector", () => {
    const out = removeDirection(
      [
        [3, 1],
        [-2, 4],
      ],
      [1, 0]
    );
    out.forEach((v) => expect(v[0]).toBeCloseTo(0));
  });
});
