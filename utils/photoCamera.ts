import type { StreamPhoto } from "@/types/photostream";

const MAKES = /^(fujifilm|apple|ricoh|sony|canon|nikon|leica)\s+/i;

export function shortCamera(camera?: string) {
  return camera?.replace(MAKES, "");
}

function formatFocal(focalLength: number) {
  return Number.isInteger(focalLength)
    ? `${focalLength}`
    : focalLength.toFixed(1);
}

export function exposureLine(
  photo: Pick<StreamPhoto, "focalLength" | "aperture" | "shutter" | "iso">
) {
  return [
    photo.focalLength ? `${formatFocal(photo.focalLength)}mm` : null,
    photo.aperture ? `f/${photo.aperture}` : null,
    photo.shutter,
    photo.iso ? `ISO ${photo.iso}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function frameNumber(n: number, pad = 3) {
  return String(n).padStart(pad, "0");
}
