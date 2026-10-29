import { describe, expect, it } from "vitest";
import type { StreamPhoto } from "@/types/photostream";
import { photoSitemapUrls } from "./photoSitemap";

const photo = (id: string, place?: string): StreamPhoto => ({
  id,
  src: `https://img.example/${id}.jpg`,
  width: 3000,
  height: 2000,
  caption: "",
  place,
});

describe("photoSitemapUrls", () => {
  it("lists canonical urls, encoding photo ids", () => {
    const urls = photoSitemapUrls(
      [photo("a b", "TOKYO · JAPAN"), photo("c")],
      ["trip"]
    );
    expect(urls).toContain("https://photos.bneo.xyz");
    expect(urls).toContain("https://photos.bneo.xyz/photos/places");
    expect(urls).toContain("https://photos.bneo.xyz/photos/photo/a%20b");
    expect(urls).toContain("https://photos.bneo.xyz/photos/sets/trip");
    expect(urls.some((u) => u.endsWith("/stream"))).toBe(false);
  });
});
