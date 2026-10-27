import type { StreamPhoto } from "@/types/photostream";
import { formatPhotoDate } from "./photoDate";
import { parsePlace } from "./photoPlaces";

// Camera and phone default names, after r2Photos turns -/_ into spaces:
// DSC00950, DSCF1234, IMG 1234, _DSC1234, PXL 20250718 123456, P1000123, R0001234.
const FILENAME =
  /^(?:(?:DSCF?|IMG|PXL|MVIMG|GOPR|DJI)[ ]?\d[\d ]*|P\d{7}|R\d{7})$/i;

export function isFilenameCaption(caption?: string): boolean {
  const text = (caption ?? "").replace(/[-_]/g, " ").trim();
  return FILENAME.test(text);
}

type Captioned = Pick<StreamPhoto, "caption" | "place" | "date">;

export function photoTitle(photo: Captioned): string | undefined {
  const caption = photo.caption?.trim();
  return caption && !isFilenameCaption(caption) ? caption : undefined;
}

// "Photo in San Francisco, Jul 18, 2025" when there is no real caption.
export function photoAlt(photo: Captioned): string {
  const title = photoTitle(photo);
  if (title) return title;
  const place = parsePlace(photo.place);
  // Most specific parts: spot + city, else city, else country.
  const parts = place
    ? place.spot
      ? [place.spot, place.city ?? place.country]
      : [place.city ?? place.country]
    : [];
  const date = formatPhotoDate(photo.date);
  const base = parts.length > 0 ? `Photo in ${parts.join(", ")}` : "Photo";
  return date ? `${base}, ${date}` : base;
}
