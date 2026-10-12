import type { PhotoCollection } from "@/types/photostream";
import manifest from "@/public/data/photo-collections.json";

// Optional editorial overrides for matching live R2 photo IDs.
// Entries here do not publish an image that is absent from the bucket.
export const photoCollections: PhotoCollection[] = manifest;
