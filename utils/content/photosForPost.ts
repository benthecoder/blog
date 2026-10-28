import type { StreamPhoto } from "@/types/photostream";

const MAX_PHOTOS = 6;

// Photo dates are EXIF calendar days ("2025-07-18", no timezone). Post dates
// are timezone-less too and parsed with local getters, like onThisDay.
function postDay(date: string): string | null {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function photosForPost(
  photos: StreamPhoto[],
  post: { slug: string; date: string }
): StreamPhoto[] {
  const day = postDay(post.date);
  return photos
    .filter(
      (photo) =>
        photo.journal === post.slug ||
        (day !== null && photo.date?.slice(0, 10) === day)
    )
    .sort(
      (a, b) =>
        (a.date ?? "").localeCompare(b.date ?? "") || a.id.localeCompare(b.id)
    )
    .slice(0, MAX_PHOTOS);
}
