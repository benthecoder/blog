import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { connection } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getR2Client } from "@/utils/r2";
import {
  buildLivePhotoCollections,
  listPhotoObjects,
  readPhotoMetadata,
  type PhotoObject,
} from "@/utils/r2Photos";
import { photoCollections } from "@/config/photoCollections";
import { applyCollectionPlaces } from "@/utils/photoPlaces";
import type { PhotoCollection, StreamPhoto } from "@/types/photostream";

const listCached = unstable_cache(
  async (bucket: string, _endpoint: string) =>
    listPhotoObjects(getR2Client(), bucket),
  ["live-photo-objects-v1"],
  { revalidate: 30 }
);
const readCached = unstable_cache(
  async (
    bucket: string,
    publicUrl: string,
    _endpoint: string,
    object: PhotoObject
  ) => {
    const response = await getR2Client().send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: object.key,
        IfMatch: object.version.startsWith('"') ? object.version : undefined,
      }),
      { abortSignal: AbortSignal.timeout(20000) }
    );
    if (!response.Body) throw new Error(`No image body: ${object.key}`);
    return readPhotoMetadata(
      Buffer.from(await response.Body.transformToByteArray()),
      object,
      publicUrl
    );
  },
  ["live-photo-metadata-v1"],
  { revalidate: false }
);

export const getPhotoCollections = cache(
  async (): Promise<PhotoCollection[]> => {
    // Discover uploads at request time, including URLs that didn't exist at build time.
    await connection();
    const bucket = process.env.PHOTOS_R2_BUCKET || "photos";
    const publicUrl =
      process.env.PHOTOS_PUBLIC_URL ||
      "https://pub-e85be102871845218dcda1cc49c78508.r2.dev";
    const endpoint = process.env.R2_ENDPOINT || "";
    const objects = await listCached(bucket, endpoint);
    return applyCollectionPlaces(
      await buildLivePhotoCollections(
        objects,
        (object) => readCached(bucket, publicUrl, endpoint, object),
        photoCollections
      )
    );
  }
);

export const getPhotostream = cache(async (): Promise<StreamPhoto[]> => {
  const unique = new Map<string, StreamPhoto>();
  for (const collection of await getPhotoCollections()) {
    for (const photo of collection.photos) {
      if (!unique.has(photo.id)) unique.set(photo.id, photo);
    }
  }
  return [...unique.values()].sort((a, b) =>
    (b.date ?? b.addedAt ?? "").localeCompare(a.date ?? a.addedAt ?? "")
  );
});

export const getPhotosets = cache(async () =>
  (await getPhotoCollections()).flatMap((collection) => [
    { ...collection, parentSlug: undefined as string | undefined },
    ...(collection.sets ?? []).map((set) => ({
      ...set,
      photos: set.photos.map(
        (photo) =>
          collection.photos.find((item) => item.id === photo.id) ?? photo
      ),
      cover: set.photos[0]?.id,
      place: collection.place,
      description: undefined,
      parentSlug: collection.slug,
      sets: undefined,
    })),
  ])
);
