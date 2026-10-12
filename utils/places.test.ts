import { describe, expect, it } from "vitest";
import raw from "@/config/places.json";
import {
  collectionPlaces,
  filterPlaces,
  mapsUrl,
  placesGeoJSON,
  placesKML,
  placesSchema,
  readMapSelection,
} from "./places";

describe("place collections", () => {
  const data = placesSchema.parse(raw);
  it("combines category filters without duplicating multi-category places", () => {
    const places = [
      { ...data.places[0], tags: ["food" as const] },
      { ...data.places[1], tags: ["cafes" as const, "shop" as const] },
      { ...data.places[2], tags: ["shop" as const] },
    ];
    expect(filterPlaces(places, [], "")).toHaveLength(3);
    expect(
      filterPlaces(places, ["food", "cafes"], "").map((place) => place.id)
    ).toEqual([places[0].id, places[1].id]);
    expect(filterPlaces(places, ["cafes", "shop"], "")).toHaveLength(2);
    expect(
      filterPlaces(places, ["food", "cafes"], "  CAPITAL  ").map(
        (place) => place.id
      )
    ).toEqual(["capital"]);
    expect(filterPlaces(places, ["outdoors"], "")).toEqual([]);
  });
  it("opens the directory by default and validates deep links", () => {
    expect(readMapSelection(data, new URLSearchParams())).toEqual({
      collectionId: null,
      placeId: null,
    });
    expect(
      readMapSelection(
        data,
        new URLSearchParams("list=sf-chinatown&place=capital")
      )
    ).toEqual({ collectionId: "sf-chinatown", placeId: "capital" });
    expect(
      readMapSelection(
        data,
        new URLSearchParams("list=boston-2023&place=capital")
      )
    ).toEqual({ collectionId: null, placeId: null });
    expect(
      readMapSelection(
        data,
        new URLSearchParams("list=sf-chinatown&place=missing")
      )
    ).toEqual({ collectionId: "sf-chinatown", placeId: null });
  });
  it("validates categories, coordinates, dates and source links", () => {
    for (const change of [
      { tags: ["unknown"] },
      { coordinates: [181, 38] },
      { source: "not-a-url" },
    ]) {
      expect(
        placesSchema.safeParse({
          ...raw,
          places: raw.places.map((place, index) =>
            index === 0 ? { ...place, ...change } : place
          ),
        }).success
      ).toBe(false);
    }
    expect(
      placesSchema.safeParse({
        ...raw,
        collections: [{ ...raw.collections[0], date: "2026-02-30" }],
      }).success
    ).toBe(false);
  });
  it("preserves imported places and trip-specific notes", () => {
    expect(collectionPlaces(data, data.collections[0])).toHaveLength(17);
    expect(data.collections.map((c) => c.id)).toEqual(["sf-chinatown"]);
    const tripCollection = {
      ...data.collections[0],
      post: "example-trip",
      entries: [
        { placeId: "capital", visitedOn: "2026-10-11", note: "A trip note" },
      ],
    };
    const trip = collectionPlaces(data, tripCollection);
    expect(trip[0].visitedOn).toBe("2026-10-11");
    expect(trip[0].post).toBe("example-trip");
    expect(trip[0].note).toBe("A trip note");
    expect(data.places[0].note).not.toBe(trip[0].note);
  });
  it("rejects dangling and duplicate place references", () => {
    const broken = structuredClone(raw);
    broken.collections[0].entries[0].placeId = "missing";
    expect(placesSchema.safeParse(broken).success).toBe(false);
    broken.collections[0].entries[0].placeId = "hons";
    expect(placesSchema.safeParse(broken).success).toBe(false);
  });
  it("exports longitude before latitude and retains travel notes", () => {
    const places = collectionPlaces(data, {
      ...data.collections[0],
      entries: [{ placeId: "capital", visitedOn: "2026-10-11" }],
    });
    const feature = placesGeoJSON(places).features[0];
    expect(feature.geometry.coordinates).toEqual([-122.4071024, 37.7940788]);
    expect(feature.properties.category).toBe("food");
    expect(feature.properties.visitedOn).toBe("2026-10-11");
    const url = new URL(mapsUrl(data.places[0]));
    expect(url.searchParams.get("query")).toBe("37.7940788,-122.4071024");
    expect(url.searchParams.get("query_place_id")).toBe(
      data.places[0].googlePlaceId
    );
  });
  it("escapes XML in downloadable KML", () => {
    const place = {
      ...data.places[0],
      name: "A & B <Cafe>",
      note: '"tea" & snacks',
    };
    const kml = placesKML("Food & drink", [place]);
    expect(kml).toContain("A &amp; B &lt;Cafe&gt;");
    expect(kml).toContain("&quot;tea&quot; &amp; snacks");
    expect(kml).toContain("-122.4071024,37.7940788,0");
  });
});
