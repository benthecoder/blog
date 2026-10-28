import { describe, expect, it } from "vitest";
import raw from "@/config/places.json";
import { placesSchema, readMapSelection } from "./places";
import { placesForPost } from "./placesInPost";

describe("placesForPost", () => {
  const data = placesSchema.parse(raw);
  it("links entries to the map with list and place params", () => {
    const entry = data.collections
      .flatMap((c) => c.entries.map((e) => ({ c, e })))
      .find(({ e }) => e.post)!;
    const place = data.places.find((p) => p.id === entry.e.placeId)!;
    const links = placesForPost(data, entry.e.post!);
    const link = links.find((l) => l.name === place.name)!;
    const params = new URL(link.href).searchParams;
    expect(readMapSelection(data, params)).toEqual({
      collectionId: entry.c.id,
      placeId: place.id,
    });
  });
  it("adds a collection link and drops duplicate hrefs", () => {
    const [first] = data.collections;
    const copy = {
      ...data,
      collections: [
        { ...first, post: "x", entries: [{ ...first.entries[0], post: "x" }] },
        { ...first, post: "x", entries: [{ ...first.entries[0], post: "x" }] },
      ],
    };
    expect(placesForPost(copy, "x")).toHaveLength(2);
  });
  it("is empty for an unlinked post", () => {
    expect(placesForPost(data, "no-such-post")).toEqual([]);
  });
});
