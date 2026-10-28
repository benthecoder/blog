import { describe, expect, it } from "vitest";
import type { StreamPhoto } from "@/types/photostream";
import { photoShareImage, photoShareMetadata } from "./photoShare";

const photo = {
  id: "a",
  src: "https://r2.example.com/trips/SF Trip/a b.jpg?x=1&y=2",
  width: 4000,
  height: 3001,
  caption: "Golden hour",
} as StreamPhoto;

describe("photoShareImage", () => {
  it("encodes the source into an absolute optimizer URL", () => {
    const { url } = photoShareImage(photo);
    expect(url).toBe(
      `https://photos.bneo.xyz/_next/image?url=${encodeURIComponent(photo.src)}&w=1200&q=75`
    );
    expect(url).not.toContain(" ");
  });

  it("rounds the scaled height and uses the caption as alt", () => {
    const image = photoShareImage(photo);
    expect(image.width).toBe(1200);
    expect(image.height).toBe(900);
    expect(image.alt).toBe("Golden hour");
  });
});

describe("photoShareMetadata", () => {
  it("omits images when there is no photo", () => {
    const meta = photoShareMetadata({ title: "t", path: "/photos" });
    expect(meta.openGraph).not.toHaveProperty("images");
    expect(meta.twitter).not.toHaveProperty("images");
    expect(meta.alternates?.canonical).toBe("https://photos.bneo.xyz/photos");
  });
});
