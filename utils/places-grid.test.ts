import { describe, expect, it } from "vitest";
import { gridReference, placesGeoJSON, type Place, type Visit } from "./places";

const place = (id: string, lng: number, lat: number): Place => ({
  id,
  name: id,
  coordinates: [lng, lat],
  address: "",
  tags: ["cafes"],
  note: "",
});

// A 5x5 sheet: lng -80..-79 (west to east), lat 25..26 (south to north).
const nw = place("nw", -80, 26);
const se = place("se", -79, 25);
const sheet: Place[] = [nw, se];

describe("gridReference", () => {
  it("puts the corners in A1 and E5", () => {
    expect(gridReference(nw, sheet)).toBe("A1");
    expect(gridReference(se, sheet)).toBe("E5");
  });
  it("puts the centre of the sheet in C3", () => {
    expect(gridReference(place("mid", -79.5, 25.5), sheet)).toBe("C3");
  });
  it("clamps places sitting exactly on the far edges", () => {
    expect(gridReference(place("edge", -79, 25), sheet)).toBe("E5");
    expect(gridReference(place("edge", -80, 26), sheet)).toBe("A1");
  });
  it("falls back to C3 for a lone place", () => {
    const lone = place("lone", -80.2, 25.8);
    expect(gridReference(lone, [lone])).toBe("C3");
    expect(gridReference(lone, [])).toBe("C3");
  });
});

describe("placesGeoJSON stations", () => {
  it("numbers stations from 1 in list order", () => {
    const visits = sheet.map((p) => ({ ...p }) as Visit);
    const geojson = placesGeoJSON(visits);
    expect(geojson.features.map((f) => f.properties.station)).toEqual([
      "1",
      "2",
    ]);
    expect(geojson.features.map((f) => f.properties.id)).toEqual(["nw", "se"]);
  });
});
