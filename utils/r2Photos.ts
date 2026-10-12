import path from "node:path";
import sharp from "sharp";
import exifr from "exifr";
import { ListObjectsV2Command, type S3Client } from "@aws-sdk/client-s3";
import type { PhotoCollection, StreamPhoto } from "@/types/photostream";
import {
  groupPhotoObjects,
  photoExifFields,
  photoObjectId,
  photoObjectUrl,
  titleFromFolder,
} from "./photoImport";

export interface PhotoObject {
  key: string;
  version: string;
  addedAt?: string;
}

export async function listPhotoObjects(client: S3Client, bucket: string) {
  const objects: PhotoObject[] = [];
  let continuation: string | undefined;
  do {
    const page = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        ContinuationToken: continuation,
      }),
      { abortSignal: AbortSignal.timeout(20000) }
    );
    for (const object of page.Contents ?? []) {
      const key = object.Key;
      if (
        !key ||
        !object.Size ||
        !/\.(jpe?g|png|webp|avif)$/i.test(key) ||
        key.split("/").some((part) => part.startsWith("."))
      )
        continue;
      objects.push({
        key,
        version: object.ETag ?? object.LastModified?.toISOString() ?? "",
        addedAt: object.LastModified?.toISOString(),
      });
    }
    continuation = page.IsTruncated ? page.NextContinuationToken : undefined;
    if (page.IsTruncated && !continuation)
      throw new Error("R2 listing ended without a continuation token");
  } while (continuation);
  return objects;
}

export async function readPhotoMetadata(
  buffer: Buffer,
  object: PhotoObject,
  publicUrl: string
): Promise<StreamPhoto> {
  const metadata = await sharp(buffer).metadata();
  if (!metadata.width || !metadata.height)
    throw new Error(`No image dimensions: ${object.key}`);
  const rotated = (metadata.orientation ?? 1) >= 5;
  const exif =
    (await exifr.parse(buffer, {
      pick: [
        "Make",
        "Model",
        "LensModel",
        "DateTimeOriginal",
        "FNumber",
        "ExposureTime",
        "ISO",
        "FocalLength",
      ],
      reviveValues: false,
      gps: false,
    })) ?? {};
  const blur = await sharp(buffer)
    .rotate()
    .resize(12, 12, { fit: "inside" })
    .webp({ quality: 50 })
    .toBuffer();
  const folders = object.key.split("/").slice(0, -1);
  return {
    id: photoObjectId(object.key),
    src: `${photoObjectUrl(publicUrl, object.key)}?v=${encodeURIComponent(object.version)}`,
    width: rotated ? metadata.height : metadata.width,
    height: rotated ? metadata.width : metadata.height,
    caption: path
      .basename(object.key)
      .replace(/\.[^.]+$/, "")
      .replace(/[-_]+/g, " "),
    location: folders.length
      ? folders.map(titleFromFolder).join(" · ")
      : undefined,
    ...photoExifFields(exif),
    addedAt: object.addedAt,
    blurDataURL: `data:image/webp;base64,${blur.toString("base64")}`,
  };
}

export async function buildLivePhotoCollections(
  objects: PhotoObject[],
  readPhoto: (object: PhotoObject) => Promise<StreamPhoto>,
  editorial: PhotoCollection[] = [],
  onError: (key: string, error: unknown) => void = (key, error) =>
    console.error(`Unable to read photo ${key}`, error)
) {
  const edits = new Map(
    editorial.flatMap((collection) =>
      collection.photos.map((photo) => [photo.id, photo] as const)
    )
  );
  const indexed: { key: string; photo: StreamPhoto }[] = [];
  // Bound downloads and image decoding when a whole album is uploaded at once.
  for (let start = 0; start < objects.length; start += 4) {
    await Promise.all(
      objects.slice(start, start + 4).map(async (object) => {
        try {
          const photo = { ...(await readPhoto(object)) };
          const old = edits.get(photo.id);
          for (const field of [
            "caption",
            "description",
            "camera",
            "lens",
            "date",
            "location",
            "journal",
            "aperture",
            "shutter",
            "iso",
            "focalLength",
          ] as const) {
            if (old?.[field] !== undefined)
              Object.assign(photo, { [field]: old[field] });
          }
          indexed.push({ key: object.key, photo });
        } catch (error) {
          onError(object.key, error);
        }
      })
    );
  }
  indexed.sort(
    (a, b) =>
      (b.photo.date ?? b.photo.addedAt ?? "").localeCompare(
        a.photo.date ?? a.photo.addedAt ?? ""
      ) || a.key.localeCompare(b.key)
  );
  return groupPhotoObjects(indexed, editorial);
}
