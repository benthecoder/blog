import type { PhotoCollection } from "@/types/photostream";
import manifest from "@/public/data/photo-collections.json";

// Optional editorial overrides for matching live R2 photo IDs.
// Entries here do not publish an image that is absent from the bucket.
// R2 folders are trips; name one "City, Country" to place it. Places are
// tagged "Spot, City, Country" (most specific
// first): set `place` on a collection for the whole trip, on a photo entry to
// override it, or "" on a photo to leave it out of Places.
export const photoCollections: PhotoCollection[] = manifest;
