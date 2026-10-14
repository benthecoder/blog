import { describe, expect, it } from "vitest";
import { exposureLine, frameNumber, shortCamera } from "./photoCamera";

describe("photoCamera", () => {
  it("shortens camera names", () => {
    expect(shortCamera("Fujifilm X100S")).toBe("X100S");
    expect(shortCamera("FUJIFILM X100S")).toBe("X100S");
    expect(shortCamera("iPhone 13 mini")).toBe("iPhone 13 mini");
    expect(shortCamera("Apple iPhone 17")).toBe("iPhone 17");
    expect(shortCamera(undefined)).toBeUndefined();
  });

  it("builds the exposure line", () => {
    expect(
      exposureLine({ focalLength: 23, aperture: 2, shutter: "1/250", iso: 400 })
    ).toBe("23mm · f/2 · 1/250 · ISO 400");
    expect(exposureLine({ focalLength: 5.7, iso: 50 })).toBe("5.7mm · ISO 50");
    expect(exposureLine({})).toBe("");
  });

  it("pads frame numbers", () => {
    expect(frameNumber(7)).toBe("007");
    expect(frameNumber(68)).toBe("068");
  });
});
