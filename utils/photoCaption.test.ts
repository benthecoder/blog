import { describe, expect, it } from "vitest";
import { isFilenameCaption, photoAlt, photoTitle } from "./photoCaption";

describe("isFilenameCaption", () => {
  it.each([
    "DSC00950",
    "dscf1234",
    "IMG 1234",
    "IMG_1234",
    " DSC1234",
    "PXL 20250718 123456",
    "P1000123",
    "R0001234",
  ])("flags %s", (name) => expect(isFilenameCaption(name)).toBe(true));

  it.each(["Golden Gate", "Dinner at 8", "R2D2", "Image of a dog", ""])(
    "keeps %s",
    (name) => expect(isFilenameCaption(name)).toBe(false)
  );
});

describe("photoTitle / photoAlt", () => {
  it("prefers a real caption", () => {
    const photo = { caption: "Fog", place: "SF, United States" };
    expect(photoTitle(photo)).toBe("Fog");
    expect(photoAlt(photo)).toBe("Fog");
  });
  it("describes from place and date", () => {
    const photo = {
      caption: "DSC00950",
      place: "Chinatown, San Francisco, United States",
      date: "2025-07-18",
    };
    expect(photoTitle(photo)).toBeUndefined();
    expect(photoAlt(photo)).toBe(
      "Photo in Chinatown, San Francisco, Jul 18, 2025"
    );
    expect(photoAlt({ ...photo, place: "San Francisco, United States" })).toBe(
      "Photo in San Francisco, Jul 18, 2025"
    );
    expect(photoAlt({ ...photo, place: "Japan", date: undefined })).toBe(
      "Photo in Japan"
    );
  });
  it("falls back to Photo", () => {
    expect(photoAlt({ caption: "IMG_1234" })).toBe("Photo");
  });
});
