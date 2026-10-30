import { describe, expect, it } from "vitest";
import { pageMetadata } from "./pageMetadata";

describe("pageMetadata", () => {
  it("sets canonical, og url and a per-page image", () => {
    const m = pageMetadata({
      title: "about",
      description: "d",
      path: "/about",
    });
    expect(m.alternates?.canonical).toBe("/about");
    expect(m.openGraph?.url).toMatch(/\/about$/);
    expect(m.openGraph?.title).toBe("about");
    expect(m.description).toBe("d");
    expect(m.twitter).toMatchObject({
      card: "summary_large_image",
      images: ["/og?title=about"],
    });
  });

  it("encodes the title in the image url", () => {
    const m = pageMetadata({ title: "#a b&c", path: "/tags/x" });
    const images = m.openGraph?.images as { url: string }[];
    expect(images[0].url).toBe("/og?title=%23a%20b%26c");
  });

  it("omits description when none is given", () => {
    const m = pageMetadata({ title: "now", path: "/now" });
    expect(m.description).toBeUndefined();
    expect(m.openGraph?.description).toBeUndefined();
    expect(m.twitter?.description).toBeUndefined();
  });
});
