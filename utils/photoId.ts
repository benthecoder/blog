const PHOTO_ID_RE =
  /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}\/L0\/\d{3}$/i;

export function isValidPhotoId(id: unknown): id is string {
  return typeof id === "string" && PHOTO_ID_RE.test(id);
}
