import { isValidPhotoId } from "./photoId";

export const PHOTO_TRANSFER_TYPE = "application/x-blog-photo";
export function readPhotoTransfer(
  raw: string
): { id: string; name: string } | null {
  try {
    const photo: unknown = JSON.parse(raw);
    if (!photo || typeof photo !== "object") return null;
    const candidate = photo as { kind?: unknown; id?: unknown; name?: unknown };
    if (
      candidate.kind !== "blog-photo" ||
      !isValidPhotoId(candidate.id) ||
      typeof candidate.name !== "string" ||
      !candidate.name ||
      candidate.name.length > 255
    )
      return null;
    return { id: candidate.id, name: candidate.name };
  } catch {
    return null;
  }
}

export function photoFileUrl(id: string, size: "thumb" | "full") {
  return `/api/admin/photos/file?id=${encodeURIComponent(id)}&size=${size}`;
}
