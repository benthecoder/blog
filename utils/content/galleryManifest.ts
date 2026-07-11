import fs from "fs";
import path from "path";
import { GALLERY_MANIFEST } from "@/config/paths";

export interface ManifestImage {
  filename: string;
  width: number;
  height: number;
}

export function readGalleryManifest(): ManifestImage[] {
  if (!fs.existsSync(GALLERY_MANIFEST)) return [];
  return JSON.parse(fs.readFileSync(GALLERY_MANIFEST, "utf8"));
}

export function writeGalleryManifest(images: ManifestImage[]): void {
  const sorted = [...images].sort((a, b) =>
    a.filename.localeCompare(b.filename)
  );
  fs.mkdirSync(path.dirname(GALLERY_MANIFEST), { recursive: true });
  fs.writeFileSync(GALLERY_MANIFEST, JSON.stringify(sorted, null, 2) + "\n");
}

export function addToGalleryManifest(image: ManifestImage): void {
  const images = readGalleryManifest().filter(
    (img) => img.filename !== image.filename
  );
  images.push(image);
  writeGalleryManifest(images);
}

export function removeFromGalleryManifest(filename: string): void {
  writeGalleryManifest(
    readGalleryManifest().filter((img) => img.filename !== filename)
  );
}
