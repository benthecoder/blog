import { describe, expect, it } from "vitest";
import type { StreamPhoto } from "@/types/photostream";
import { buildPhotoFeed } from "./photoFeed";

const photo = (id: string, extra: Partial<StreamPhoto> = {}): StreamPhoto => ({
  id,
  src: `https://img.example/${id}.jpg`,
  width: 3000,
  height: 2000,
  caption: "",
  ...extra,
});

describe("buildPhotoFeed", () => {
  it("orders newest addedAt first", () => {
    const xml = buildPhotoFeed([
      photo("old", { addedAt: "2024-01-01T00:00:00Z" }),
      photo("new", { addedAt: "2025-06-01T00:00:00Z" }),
    ]);
    expect(xml.indexOf("/photo/new")).toBeLessThan(xml.indexOf("/photo/old"));
    expect(xml).toContain("<lastBuildDate>Sun, 01 Jun 2025");
  });

  it("falls back to date when addedAt is missing", () => {
    const xml = buildPhotoFeed([photo("a", { date: "2023-03-04" })]);
    expect(xml).toContain("<pubDate>Sat, 04 Mar 2023");
  });

  it("caps at 50 items", () => {
    const many = Array.from({ length: 60 }, (_, i) =>
      photo(`p${i}`, { addedAt: new Date(2025, 0, 1 + i).toISOString() })
    );
    expect(buildPhotoFeed(many).match(/<item>/g)).toHaveLength(50);
  });

  it("uses absolute guid and image urls", () => {
    const xml = buildPhotoFeed([photo("a b")]);
    expect(xml).toContain("<guid>https://photos.bneo.xyz/photo/a%20b</guid>");
    expect(xml).toContain('src="https://photos.bneo.xyz/_next/image?url=');
    expect(xml).toContain('width="1200" height="800"');
  });

  it("escapes captions with ]]> and <", () => {
    const xml = buildPhotoFeed([photo("a", { caption: "a ]]> <b>x</b>" })]);
    expect(xml).not.toContain("a ]]> <b>");
    expect(xml).toContain("]]]]><![CDATA[>");
    expect(xml).toContain("&lt;b&gt;x&lt;/b&gt;");
  });

  it("builds an empty channel", () => {
    const xml = buildPhotoFeed([]);
    expect(xml).not.toContain("<item>");
    expect(xml).not.toContain("lastBuildDate");
    expect(xml).toContain("<language>en</language>");
  });
});
