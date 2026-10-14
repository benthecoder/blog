import { describe, expect, it } from "vitest";
import type { PhotoCollection, StreamPhoto } from "@/types/photostream";
import {
  applyCollectionPlaces,
  parsePlace,
  placeSlug,
  placeTree,
} from "./photoPlaces";

const photo = (id: string, place?: string): StreamPhoto => ({
  id,
  src: "/x.jpg",
  width: 3,
  height: 2,
  caption: id,
  place,
});

describe("photoPlaces", () => {
  it("parses from the end", () => {
    expect(parsePlace("Chinatown, San Francisco, United States")).toEqual({
      spot: "Chinatown",
      city: "San Francisco",
      country: "United States",
    });
    expect(parsePlace(" Penang , Malaysia ")).toEqual({
      spot: undefined,
      city: "Penang",
      country: "Malaysia",
    });
    expect(parsePlace("Malaysia")?.country).toBe("Malaysia");
    expect(parsePlace("A, B, C, D")?.spot).toBe("A, B");
    expect(parsePlace("")).toBeNull();
    expect(parsePlace(undefined)).toBeNull();
  });

  it("slugs names", () => {
    expect(placeSlug("Kuala Lumpur")).toBe("kuala-lumpur");
    expect(placeSlug("São Paulo")).toBe("so-paulo");
  });

  it("inherits trip places without mutating", () => {
    const input: PhotoCollection[] = [
      {
        slug: "t",
        title: "T",
        cover: "a",
        place: "Penang, Malaysia",
        photos: [photo("a"), photo("b", ""), photo("c", "Japan")],
        sets: [{ slug: "t--d", title: "D", photos: [photo("a")] }],
      },
    ];
    const [out] = applyCollectionPlaces(input);
    expect(out.photos.map((p) => p.place)).toEqual([
      "Penang, Malaysia",
      "",
      "Japan",
    ]);
    expect(out.sets?.[0].photos[0].place).toBe("Penang, Malaysia");
    expect(input[0].photos[0].place).toBeUndefined();
  });

  it("builds a country and city tree", () => {
    const tree = placeTree([
      photo("a", "Chinatown, San Francisco, United States"),
      photo("b", "San Francisco, United States"),
      photo("c", "Penang, Malaysia"),
      photo("d", "Malaysia"),
      photo("e", "Miami, United States"),
      photo("f", ""),
      photo("g"),
    ]);
    expect(tree.map((c) => [c.country, c.slug, c.count])).toEqual([
      ["United States", "united-states", 3],
      ["Malaysia", "malaysia", 2],
    ]);
    expect(tree[0].cities.map((c) => [c.city, c.count])).toEqual([
      ["San Francisco", 2],
      ["Miami", 1],
    ]);
    expect(tree[0].cities[0].spots).toEqual(["Chinatown"]);
    expect(tree[1].cities.map((c) => c.city)).toContain("Malaysia");
  });
});
