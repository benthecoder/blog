import { describe, expect, it } from "vitest";
import {
  groupTravelPosts,
  parseLocations,
  travelPlaceId,
  legacyTravelDestination,
  isPlaceEntry,
  type PlaceGroup,
} from "./travel";
import { PLACE_DEFINITIONS } from "@/config/travel";
import type { PostMetadata } from "@/types/post";
const post = (
  slug: string,
  date: string,
  locations?: string[],
  isDraft = false
): PostMetadata => ({
  slug,
  title: slug,
  date,
  locations,
  isDraft,
  tags: [],
  wordcount: 0,
  prev: null,
  next: null,
});
const flatten = (groups: PlaceGroup[]): PlaceGroup[] =>
  groups.flatMap((group) => [group, ...flatten(group.children)]);
describe("place hierarchy", () => {
  it("preserves old location anchors and normalizes explicit locations", () => {
    expect(legacyTravelDestination("SF")).toBe("San Francisco Bay Area");
    expect(legacyTravelDestination("AI")).toBeUndefined();
    expect(travelPlaceId("Washington, D.C.")).toBe("place-washington-d-c");
    expect(parseLocations("San Francisco")).toEqual([]);
    expect(
      parseLocations([" Taipei ", "", null, "Taipei", "Hong Kong"])
    ).toEqual(["Taipei", "Hong Kong"]);
    expect(parseLocations(["Yosemite", "Yosemite National Park"])).toEqual([
      "Yosemite",
    ]);
  });
  it("does not guess locations from topic tags, excludes drafts, and orders entries newest first", () => {
    const recent = post("taipei-2025", "2025-05-01", ["Taipei", "Hong Kong"]);
    const groups = groupTravelPosts([
      post("taipei-2023", "2023-01-01", ["Taipei", "Taipei"]),
      recent,
      { ...post("san-francisco", "2026-01-01"), tags: ["travel", "SF"] },
      post("draft", "2026-01-01", ["Boston"], true),
    ]);
    expect(groups.map((group) => group.label)).toEqual(["Hong Kong", "Taiwan"]);
    expect(
      groups.find((group) => group.id === "taiwan")?.posts.map((p) => p.slug)
    ).toEqual(["taipei-2025", "taipei-2023"]);
  });
  it("keeps countries, regions, and places at the same level regardless of sibling counts", () => {
    const single = groupTravelPosts([post("boston", "2025-01-01", ["Boston"])]);
    expect(single[0].id).toBe("united-states");
    expect(single[0].children[0].id).toBe("massachusetts");
    expect(single[0].children[0].children[0].id).toBe("boston");
    const expanded = groupTravelPosts([
      post("boston", "2025-01-01", ["Boston"]),
      post("sf", "2025-01-02", ["San Francisco"]),
    ]);
    expect(expanded[0].children.map((g) => g.id)).toEqual([
      "california",
      "massachusetts",
    ]);
    expect(
      expanded[0].children.find((g) => g.id === "massachusetts")?.children[0].id
    ).toBe("boston");
  });
  it("uses ancestry to avoid overlap without a special California-trip exception", () => {
    const groups = groupTravelPosts([
      post("muir", "2025-01-01", ["Muir Woods", "Mill Valley", "Sausalito"]),
      post("both", "2025-01-02", ["Yosemite", "San Francisco"]),
    ]);
    const places = flatten(groups);
    expect(
      places.find((g) => g.id === "muir-woods")?.posts.map((p) => p.slug)
    ).toEqual(["muir"]);
    expect(
      places
        .find((g) => g.id === "san-francisco-bay-area")
        ?.posts.map((p) => p.slug)
    ).toEqual(["both"]);
    expect(
      places.find((g) => g.id === "yosemite")?.posts.map((p) => p.slug)
    ).toEqual(["both"]);
    expect(groups[0].count).toBe(2);
  });
  it("excludes transit and passing mentions while preserving explicit visit overrides", () => {
    expect(
      isPlaceEntry({
        ...post("flight", "2025-01-01", ["Boston"]),
        title: "aus -> bos",
      })
    ).toBe(false);
    expect(
      isPlaceEntry({
        ...post("flight", "2025-01-01", ["Boston"]),
        title: "bos -> sf",
        placeContext: "visit",
      })
    ).toBe(true);
    expect(
      isPlaceEntry({
        ...post("flight", "2025-01-01", ["Boston"]),
        placeContext: "transit",
      })
    ).toBe(false);
    expect(
      isPlaceEntry({
        ...post("mention", "2025-01-01", ["Boston"]),
        placeContext: "mention",
      })
    ).toBe(false);
  });
  it("keeps new unregistered places visible without guessing a country", () => {
    const groups = groupTravelPosts([
      post("new", "2025-01-01", ["A New Place"]),
    ]);
    expect(groups[0].id).toBe("other-places");
    expect(groups[0].children[0].label).toBe("A New Place");
  });
  it("has unique IDs and acyclic parent chains for future extensions", () => {
    const byId = new Map(PLACE_DEFINITIONS.map((place) => [place.id, place]));
    expect(byId.size).toBe(PLACE_DEFINITIONS.length);
    for (const place of PLACE_DEFINITIONS) {
      const seen = new Set<string>();
      let current: typeof place | undefined = place;
      while (current) {
        expect(seen.has(current.id)).toBe(false);
        seen.add(current.id);
        if (current.parentId) expect(byId.has(current.parentId)).toBe(true);
        current = current.parentId ? byId.get(current.parentId) : undefined;
      }
    }
  });
});
