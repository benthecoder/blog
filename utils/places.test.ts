import { describe, expect, it } from "vitest";
import raw from "@/config/places.json";
import {
  collectionPlaces,
  mapsUrl,
  placesGeoJSON,
  placesKML,
  placesSchema,
} from "./places";

describe("place collections", () => {
  const data = placesSchema.parse(raw);
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
