import type { PhotoCollection } from "@/types/photostream";
import manifest from "@/public/data/photo-collections.json";

// The manifest contains public photos from the dedicated photos bucket.
// Importing is explicit; rendering never lists R2 or scans a local library.
export const photoCollections: PhotoCollection[] = manifest;
