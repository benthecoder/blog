import { cache } from "react";
import { photoCollections } from "@/config/photoCollections";
import type { PhotoCollection, StreamPhoto } from "@/types/photostream";

export const getPhotoCollections = cache((): PhotoCollection[] =>
  photoCollections.filter((collection) => collection.photos.length > 0)
);

export const getPhotostream = cache((): StreamPhoto[] => {
  const unique = new Map<string, StreamPhoto>();
  for (const collection of getPhotoCollections()) {
    for (const photo of collection.photos) {
      if (!unique.has(photo.id)) unique.set(photo.id, photo);
    }
  }
  return [...unique.values()].sort((a, b) =>
    (b.date ?? b.addedAt ?? "").localeCompare(a.date ?? a.addedAt ?? "")
  );
});

export const getPhotosets = cache(() =>
  getPhotoCollections().flatMap((collection) => [
    { ...collection, parentSlug: undefined as string | undefined },
    ...(collection.sets ?? []).map((set) => ({
      ...set,
      photos: set.photos.map(
        (photo) =>
          collection.photos.find((item) => item.id === photo.id) ?? photo
      ),
      cover: set.photos[0]?.id,
      description: undefined,
      parentSlug: collection.slug,
      sets: undefined,
    })),
  ])
);
