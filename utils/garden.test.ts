import { describe, expect, it } from "vitest";
import { gardenPosition, readGarden, GARDEN_LIMIT } from "./garden";

const plant = { id: "one", x: 50, y: 76, tilt: -4, size: 1 };
describe("browser garden recovery", () => {
  it("restores positions and variation", () => {
    expect(readGarden(JSON.stringify([plant]))).toEqual([plant]);
  });
  it.each([null, "{", "null", "{}", '[{"x":50}]'])(
    "ignores unavailable or corrupted copies: %s",
    (raw) => {
      expect(readGarden(raw)).toEqual([]);
    }
  );
  it("ignores duplicate IDs and out-of-range stored positions", () => {
    expect(readGarden(JSON.stringify([plant, plant]))).toEqual([]);
    expect(readGarden(JSON.stringify([{ ...plant, x: 999 }]))).toEqual([]);
    expect(readGarden(JSON.stringify([{ ...plant, size: "1" }]))).toEqual([]);
  });
  it("bounds restored gardens to the interaction limit", () => {
    const plants = Array.from({ length: GARDEN_LIMIT + 1 }, (_, index) => ({
      ...plant,
      id: String(index),
    }));
    expect(readGarden(JSON.stringify(plants))).toEqual([]);
    expect(
      readGarden(JSON.stringify(plants.slice(0, GARDEN_LIMIT)))
    ).toHaveLength(GARDEN_LIMIT);
  });
  it("keeps mouse and keyboard positions inside the plantable area", () => {
    expect(gardenPosition(-30, 200)).toEqual({ x: 12, y: 94 });
    expect(gardenPosition(150, -10)).toEqual({ x: 88, y: 40 });
    expect(gardenPosition(50, 76)).toEqual({ x: 50, y: 76 });
  });
});
