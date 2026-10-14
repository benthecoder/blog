import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import exifr from "exifr";
import { GetObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getR2Client } from "../utils/r2";
import { PHOTO_COLLECTIONS_JSON } from "../config/paths";
import {
  groupPhotoObjects,
  photoExifFields,
  photoObjectId,
  photoObjectUrl,
} from "../utils/photoImport";
import type { PhotoCollection, StreamPhoto } from "../types/photostream";

async function main() {
  const bucket = process.env.PHOTOS_R2_BUCKET || "photos";
  const publicUrl =
    process.env.PHOTOS_PUBLIC_URL ||
    "https://pub-e85be102871845218dcda1cc49c78508.r2.dev";
  const previous: PhotoCollection[] = fs.existsSync(PHOTO_COLLECTIONS_JSON)
    ? JSON.parse(fs.readFileSync(PHOTO_COLLECTIONS_JSON, "utf8"))
    : [];
  const previousPhotos = new Map(
    previous.flatMap((collection) =>
      collection.photos.map((photo) => [photo.id, photo] as const)
    )
  );
  const client = getR2Client();
  const objects: { key: string; photo: StreamPhoto }[] = [];
  let continuation: string | undefined;
  do {
    const page = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        ContinuationToken: continuation,
      })
    );
    for (const object of page.Contents ?? []) {
      const key = object.Key;
      if (
        !key ||
        !/\.(jpe?g|png|webp|avif)$/i.test(key) ||
        key.split("/").some((part) => part.startsWith("."))
      )
        continue;
      const id = photoObjectId(key);
      const old = previousPhotos.get(id);
      const addedAt = object.LastModified?.toISOString();
      if (old && old.addedAt === addedAt) {
        objects.push({ key, photo: old });
        continue;
      }
      const response = await client.send(
        new GetObjectCommand({ Bucket: bucket, Key: key })
      );
      if (!response.Body) throw new Error(`No image body: ${key}`);
      const buffer = Buffer.from(await response.Body.transformToByteArray());
      const metadata = await sharp(buffer).metadata();
      if (!metadata.width || !metadata.height)
        throw new Error(`No image dimensions: ${key}`);
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
      const fields = photoExifFields(exif);
      const photo: StreamPhoto = {
        id,
        src: photoObjectUrl(publicUrl, key),
        width: rotated ? metadata.height : metadata.width,
        height: rotated ? metadata.width : metadata.height,
        caption:
          old?.caption ??
          path
            .basename(key)
            .replace(/\.[^.]+$/, "")
            .replace(/[-_]+/g, " "),
        ...fields,
        addedAt,
        blurDataURL: `data:image/webp;base64,${blur.toString("base64")}`,
      };
      // Editorial fields survive reimports. EXIF is a starting point, not a
      // reason to overwrite a caption, description, or corrected camera.
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
      objects.push({ key, photo });
      console.log(`Indexed ${key}`);
    }
    continuation = page.IsTruncated ? page.NextContinuationToken : undefined;
    if (page.IsTruncated && !continuation)
      throw new Error("R2 listing ended without a continuation token");
  } while (continuation);
  if (!objects.length)
    throw new Error(
      "No photos found. Upload JPEG, PNG, WebP, or AVIF images to the photos bucket first. The existing manifest was kept."
    );
  objects.sort((a, b) =>
    (b.photo.date ?? b.photo.addedAt ?? "").localeCompare(
      a.photo.date ?? a.photo.addedAt ?? ""
    )
  );
  const collections = groupPhotoObjects(objects, previous);
  const temporary = `${PHOTO_COLLECTIONS_JSON}.tmp`;
  fs.writeFileSync(temporary, JSON.stringify(collections, null, 2) + "\n");
  fs.renameSync(temporary, PHOTO_COLLECTIONS_JSON);
  console.log(
    `${objects.length} photos in ${collections.length} collections. Review public/data/photo-collections.json, then commit and deploy.`
  );
}
main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
