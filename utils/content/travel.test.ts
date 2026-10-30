import { describe, expect, it } from "vitest";
import {
  groupTravelPosts,
  parseLocations,
  travelPlaceId,
  legacyTravelDestination,
} from "./travel";
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

describe("travel destinations", () => {
  it("keeps retired location tags linked to stable destination sections", () => {
    expect(legacyTravelDestination("SF")).toBe("San Francisco Bay Area");
    expect(legacyTravelDestination("AI")).toBeUndefined();
    expect(travelPlaceId("San Francisco")).toBe("place-san-francisco");
    expect(travelPlaceId("Washington, D.C.")).toBe("place-washington-d-c");
  });
  it("requires explicit locations, trims them, and removes duplicates", () => {
    expect(parseLocations("San Francisco")).toEqual([]);
    expect(
      parseLocations([" Taipei ", "", null, "Taipei", "Hong Kong"])
    ).toEqual(["Taipei", "Hong Kong"]);
    expect(parseLocations(["Yosemite", "Yosemite National Park"])).toEqual([
      "Yosemite",
    ]);
  });

  it("groups by destination across years, newest first, without drafts or guesses", () => {
    const old = post("taipei-2023", "2023-01-01", ["Taipei", "Taipei"]);
    const recent = post("taipei-2025", "2025-05-01", ["Taipei", "Hong Kong"]);
    const unlocated = {
      ...post("san-francisco", "2026-01-01"),
      tags: ["travel", "SF"],
    };
    const groups = groupTravelPosts([
      old,
      unlocated,
      recent,
      post("draft", "2026-01-01", ["Boston"], true),
    ]);
    expect(
      groups.flatMap((region) =>
        region.destinations.map((place) => [
          place.label,
          place.posts.map((p) => p.slug),
        ])
      )
    ).toEqual([
      ["Hong Kong", ["taipei-2025"]],
      ["Taiwan", ["taipei-2025", "taipei-2023"]],
    ]);
  });

  it("uses broad regional buckets, keeps named trips together, and avoids duplicate rows for small stops", () => {
    const groups = groupTravelPosts([
      post("sf", "2024-01-01", ["San Francisco", "Berkeley", "Palo Alto"]),
      post("muir", "2024-01-02", ["Muir Woods", "Mill Valley", "Sausalito"]),
      post("yosemite-day-1", "2024-01-03", ["Yosemite"]),
      post("yosemite-day-2", "2024-01-04", ["Yosemite National Park"]),
      post("taiwan", "2024-01-05", ["Taipei", "Jiufen", "Yilan"]),
    ]);
    expect(
      groups.map((region) => ({
        region: region.label,
        destinations: region.destinations.map((d) => ({
          place: d.label,
          slugs: d.posts.map((p) => p.slug),
        })),
      }))
    ).toEqual([
      {
        region: "California",
        destinations: [
          { place: "San Francisco Bay Area", slugs: ["sf"] },
          { place: "Yosemite", slugs: ["yosemite-day-2", "yosemite-day-1"] },
          { place: "Muir Woods", slugs: ["muir"] },
        ],
      },
      {
        region: "Taiwan",
        destinations: [{ place: "Taiwan", slugs: ["taiwan"] }],
      },
    ]);
  });
});
