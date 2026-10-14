import { describe, expect, it, vi } from "vitest";
import sharp from "sharp";
import { type S3Client } from "@aws-sdk/client-s3";
import {
  buildLivePhotoCollections,
  listPhotoObjects,
  readPhotoMetadata,
  type PhotoObject,
} from "./r2Photos";
import { photoObjectId } from "./photoImport";
import type { StreamPhoto } from "@/types/photostream";

const object = (key: string, version = '"one"'): PhotoObject => ({
  key,
  version,
  addedAt: "2026-10-12T12:00:00Z",
});
const read = async (entry: PhotoObject): Promise<StreamPhoto> => ({
  id: photoObjectId(entry.key),
  src: `https://photos.example/${entry.key}?v=${entry.version}`,
  caption: entry.key,
  width: 1200,
  height: 800,
  addedAt: entry.addedAt,
});

describe("automatic R2 photos", () => {
  it("discovers new folders and removes deleted photos without a saved index", async () => {
    const first = object("sf/chinatown/one.jpg");
    const second = object("taiwan/taipei/two.jpg");
    const previous = await buildLivePhotoCollections([first], read);
    const uploaded = await buildLivePhotoCollections(
      [first, second],
      read,
      previous
    );
    expect(uploaded.map((collection) => collection.slug)).toEqual([
      "sf",
      "taiwan",
    ]);
    expect(uploaded[1].sets?.[0].slug).toBe("taiwan--taipei");
    const deleted = await buildLivePhotoCollections([second], read, uploaded);
    expect(deleted.map((collection) => collection.slug)).toEqual(["taiwan"]);
    expect(await buildLivePhotoCollections([], read, uploaded)).toEqual([]);
  });

  it("keeps editorial descriptions while using the current image version", async () => {
    const previous = await buildLivePhotoCollections(
      [object("sf/one.jpg")],
      read
    );
    previous[0].photos[0].description = "A rainy walk";
    previous[0].photos[0].camera = "Fujifilm X100S";
    const current = await buildLivePhotoCollections(
      [object("sf/one.jpg", '"two"')],
      read,
      previous
    );
    expect(current[0].photos[0]).toMatchObject({
      description: "A rainy walk",
      camera: "Fujifilm X100S",
    });
    expect(current[0].photos[0].src).toContain('"two"');
  });

  it("a corrupt upload does not hide the rest of a collection", async () => {
    const onError = vi.fn();
    const collections = await buildLivePhotoCollections(
      [object("sf/bad.jpg"), object("sf/good.jpg")],
      async (entry) => {
        if (entry.key.includes("bad")) throw new Error("Invalid JPEG");
        return read(entry);
      },
      [],
      onError
    );
    expect(collections[0].photos).toHaveLength(1);
    expect(onError).toHaveBeenCalledWith("sf/bad.jpg", expect.any(Error));
  });

  it("paginates the bucket and ignores markers, hidden files, and unsupported files", async () => {
    const send = vi
      .fn()
      .mockResolvedValueOnce({
        IsTruncated: true,
        NextContinuationToken: "page-two",
        Contents: [
          { Key: "sf/", Size: 0 },
          { Key: "sf/.private.jpg", Size: 100 },
          { Key: "sf/readme.txt", Size: 100 },
          { Key: "sf/one.JPG", Size: 100, ETag: '"one"' },
        ],
      })
      .mockResolvedValueOnce({
        Contents: [{ Key: "sf/two.webp", Size: 100, ETag: '"two"' }],
      });
    const result = await listPhotoObjects(
      { send } as unknown as S3Client,
      "photos"
    );
    expect(result.map((entry) => entry.key)).toEqual([
      "sf/one.JPG",
      "sf/two.webp",
    ]);
    expect(send.mock.calls[1][0].input).toMatchObject({
      Bucket: "photos",
      ContinuationToken: "page-two",
    });
  });

  it("reads real JPEG dimensions, Fujifilm EXIF, and a versioned image URL", async () => {
    const buffer = await sharp({
      create: { width: 60, height: 40, channels: 3, background: "white" },
    })
      .jpeg()
      .withExif({
        IFD0: { Make: "FUJIFILM", Model: "X100S" },
        IFD2: { DateTimeOriginal: "2024:02:16 12:00:00" },
      })
      .toBuffer();
    const photo = await readPhotoMetadata(
      buffer,
      object("sf/chinatown/a walk.jpg"),
      "https://photos.example"
    );
    expect(photo).toMatchObject({
      width: 60,
      height: 40,
      camera: "Fujifilm X100S",
      date: "2024-02-16",
      location: "Sf · Chinatown",
      caption: "a walk",
    });
    expect(photo.src).toBe(
      "https://photos.example/sf/chinatown/a%20walk.jpg?v=%22one%22"
    );
    expect(photo.blurDataURL).toMatch(/^data:image\/webp;base64,/);
    expect(photo).not.toHaveProperty("latitude");
  });
});
