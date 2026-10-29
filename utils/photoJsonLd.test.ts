import { describe, expect, it } from "vitest";
import { photoJsonLd } from "./photoJsonLd";

const base = {
  id: "a b",
  src: "https://cdn.example.com/a.jpg?v=1",
  width: 3000,
  height: 2000,
  caption: "DSC00950",
};

describe("photoJsonLd", () => {
  it("credits the photographer and omits missing data", () => {
    const ld = photoJsonLd(base);
    expect(ld["@type"]).toBe("ImageObject");
    expect(ld.contentUrl).toBe(base.src);
    expect(ld.url).toBe("https://photos.bneo.xyz/photo/a%20b");
    expect(ld.creator.name).toBe("Benedict Neo");
    expect(ld.creditText).toBe("Benedict Neo");
    expect(ld.thumbnailUrl).toContain("/_next/image?url=");
    expect(ld).not.toHaveProperty("name");
    expect(ld).not.toHaveProperty("dateCreated");
    expect(ld).not.toHaveProperty("contentLocation");
    expect(ld).not.toHaveProperty("license");
  });

  it("uses title, date part only, and place", () => {
    const ld = photoJsonLd({
      ...base,
      caption: "Golden hour",
      date: "2025-07-18T23:30:00-07:00",
      place: "Pier 7, San Francisco, USA",
    });
    expect(ld.name).toBe("Golden hour");
    expect(ld.dateCreated).toBe("2025-07-18");
    expect(ld.contentLocation).toEqual({
      "@type": "Place",
      name: "Pier 7, San Francisco, USA",
    });
  });

  it("makes a relative src absolute and ignores bad dates", () => {
    const ld = photoJsonLd({ ...base, src: "/x.jpg", date: "nope" });
    expect(ld.contentUrl).toBe("https://photos.bneo.xyz/x.jpg");
    expect(ld).not.toHaveProperty("dateCreated");
  });
});
