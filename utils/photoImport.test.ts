import { describe, expect, it } from "vitest";
import {
  groupPhotoObjects,
  photoExifFields,
  photoObjectUrl,
} from "./photoImport";
import type { StreamPhoto } from "@/types/photostream";

const photo = (id: string): StreamPhoto => ({
  id,
  src: `/images/${id}.jpg`,
  caption: id,
  width: 1200,
  height: 800,
});

describe("photo collection imports", () => {
  it("groups a trip and its nested sets without duplicating stream photos", () => {
    const collections = groupPhotoObjects([
      { key: "san-francisco/chinatown/one.jpg", photo: photo("one") },
      { key: "san-francisco/everyday/two.jpg", photo: photo("two") },
      { key: "taiwan-2024/taipei/three.jpg", photo: photo("three") },
    ]);
    expect(collections.map((item) => item.title)).toEqual([
      "San Francisco",
      "Taiwan 2024",
    ]);
    expect(collections[0].photos.map((item) => item.id)).toEqual([
      "one",
      "two",
    ]);
    expect(collections[0].sets?.map((item) => item.slug)).toEqual([
      "san-francisco--chinatown",
      "san-francisco--everyday",
    ]);
  });
  it("places a City, Country folder without a manifest entry", () => {
    const [collection] = groupPhotoObjects([
      { key: "lisbon, portugal/one.jpg", photo: photo("one") },
    ]);
    expect(collection).toMatchObject({
      slug: "lisbon",
      title: "Lisbon",
      place: "Lisbon, Portugal",
    });
  });
  it("keeps edited collection titles, descriptions, and cover choices", () => {
    const previous = [
      {
        slug: "sf",
        title: "San Francisco",
        description: "My city walks",
        cover: "two",
        photos: [photo("one"), photo("two")],
      },
    ];
    const [collection] = groupPhotoObjects(
      [
        { key: "sf/one.jpg", photo: photo("one") },
        { key: "sf/two.jpg", photo: photo("two") },
      ],
      previous
    );
    expect(collection).toMatchObject({
      title: "San Francisco",
      description: "My city walks",
      cover: "two",
    });
  });
  it("rejects ambiguous collection URLs", () => {
    expect(() =>
      groupPhotoObjects([
        { key: "San Francisco/one.jpg", photo: photo("one") },
        { key: "san-francisco/two.jpg", photo: photo("two") },
      ])
    ).toThrow("same URL");
  });
  it("encodes object paths with spaces, commas, and unicode", () => {
    expect(
      photoObjectUrl("https://photos.example/", "Chinatown, SF/梁.jpg")
    ).toBe("https://photos.example/Chinatown%2C%20SF/%E6%A2%81.jpg");
  });
  it("reads camera and exposure without turning upload time into capture time", () => {
    expect(
      photoExifFields({
        Make: "FUJIFILM",
        Model: "X100S",
        DateTimeOriginal: "2024:06:01 23:59:00",
        ExposureTime: 0.004,
        FNumber: 2.8,
        ISO: 400,
      })
    ).toMatchObject({
      camera: "Fujifilm X100S",
      date: "2024-06-01",
      shutter: "1/250",
      aperture: 2.8,
      iso: 400,
    });
    expect(
      photoExifFields({ Make: "FUJIFILM", Model: "FUJIFILM X100S" }).camera
    ).toBe("FUJIFILM X100S");
    expect(photoExifFields({}).date).toBeUndefined();
    expect(photoExifFields({ ISO: -1, FNumber: Infinity }).iso).toBeUndefined();
  });
});
