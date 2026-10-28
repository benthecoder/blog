import { describe, expect, it } from "vitest";
import type { StreamPhoto } from "@/types/photostream";
import { photosForPost } from "./photosForPost";

const photo = (id: string, extra: Partial<StreamPhoto> = {}): StreamPhoto => ({
  id,
  src: `https://r2.test/${id}.jpg`,
  width: 100,
  height: 100,
  caption: id,
  ...extra,
});

const post = { slug: "180725", date: "Jul 18, 2025" };

describe("photosForPost", () => {
  it("matches by calendar date, ignoring slug shape", () => {
    const out = photosForPost(
      [photo("a", { date: "2025-07-18" }), photo("b", { date: "2025-07-18" })],
      { slug: "weekend-trip", date: "Jul 18, 2025" }
    );
    expect(out.map((p) => p.id)).toEqual(["a", "b"]);
  });

  it("matches an explicit journal slug on another day", () => {
    const out = photosForPost(
      [photo("a", { journal: "180725", date: "2025-07-01" })],
      post
    );
    expect(out.map((p) => p.id)).toEqual(["a"]);
  });

  it("excludes other days, including the same day in another year", () => {
    const out = photosForPost(
      [
        photo("a", { date: "2025-07-17" }),
        photo("b", { date: "2024-07-18" }),
        photo("c"),
      ],
      post
    );
    expect(out).toEqual([]);
  });

  it("orders oldest first and caps at six", () => {
    const photos = ["h", "g", "f", "e", "d", "c", "b", "a"].map((id) =>
      photo(id, { date: "2025-07-18" })
    );
    const out = photosForPost(photos, post);
    expect(out.map((p) => p.id)).toEqual(["a", "b", "c", "d", "e", "f"]);
  });

  it("handles empty input and unparseable post dates", () => {
    expect(photosForPost([], post)).toEqual([]);
    expect(
      photosForPost([photo("a", { date: "2025-07-18" })], {
        slug: "x",
        date: "nope",
      })
    ).toEqual([]);
  });
});
