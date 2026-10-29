import { PHOTOS_URL } from "@/config/site";
import type { StreamPhoto } from "@/types/photostream";
import { formatPhotoDate } from "@/utils/photoDate";
import { photoAlt, photoTitle } from "@/utils/photoCaption";
import { photoShareImage } from "@/utils/photoShare";
import { cdata } from "./rss";

const PHOTO_FEED_LIMIT = 50;

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

// When the photo reached the stream; capture date is the fallback.
function publishedAt(photo: StreamPhoto): Date | undefined {
  for (const value of [photo.addedAt, photo.date]) {
    if (!value) continue;
    const d = new Date(value.length === 10 ? `${value}T12:00:00Z` : value);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return undefined;
}

function photoFeedTitle(photo: StreamPhoto) {
  return photoTitle(photo) ?? photoAlt(photo).replace(/^Photo in /, "");
}

export function buildPhotoFeed(photos: StreamPhoto[]): string {
  const recent = photos
    .map((photo) => ({ photo, at: publishedAt(photo) }))
    .sort((a, b) => (b.at?.getTime() ?? 0) - (a.at?.getTime() ?? 0))
    .slice(0, PHOTO_FEED_LIMIT);

  const items = recent
    .map(({ photo, at }) => {
      const url = `${PHOTOS_URL}/photo/${encodeURIComponent(photo.id)}`;
      const image = photoShareImage(photo);
      const alt = escapeHtml(photoAlt(photo));
      const details = [
        photo.place?.split(",")[0]?.trim(),
        formatPhotoDate(photo.date),
        photo.camera,
      ].filter(Boolean);
      const html =
        `<p><img src="${escapeHtml(image.url)}" alt="${alt}" width="${image.width}" height="${image.height}"></p>` +
        (details.length
          ? `<p>${details.map((d) => escapeHtml(d as string)).join(" · ")}</p>`
          : "");
      return `<item>
<title>${cdata(photoFeedTitle(photo))}</title>
<link>${url}</link><guid>${url}</guid>
${at ? `<pubDate>${at.toUTCString()}</pubDate>\n` : ""}<description>${cdata(photoAlt(photo))}</description>
<content:encoded>${cdata(html)}</content:encoded>
</item>`;
    })
    .join("\n");

  const newest = recent[0]?.at;
  const date = newest
    ? `<lastBuildDate>${newest.toUTCString()}</lastBuildDate>\n`
    : "";
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
<channel><title>Benedict Neo — photos</title>
<description>Every photo, by month.</description>
<language>en</language>
<link>${PHOTOS_URL}</link><atom:link href="${PHOTOS_URL}/rss.xml" rel="self" type="application/rss+xml" />
${date}${items}</channel></rss>`;
}
