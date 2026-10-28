import { PERSON_ID } from "@/config/person";
import { PHOTOS_URL } from "@/config/site";
import type { StreamPhoto } from "@/types/photostream";
import { photoAlt, photoTitle } from "./photoCaption";
import { photoShareImage } from "./photoShare";

const AUTHOR = "Benedict Neo";

/** schema.org ImageObject for a photo permalink, so Google Images can credit
 * the photographer. Fields are left out when the data is missing. */
export function photoJsonLd(photo: StreamPhoto) {
  const name = photoTitle(photo);
  const date = photo.date?.slice(0, 10);
  const validDate =
    date && /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(date))
      ? date
      : undefined;
  const place = photo.place?.trim() || photo.location?.trim();
  return {
    "@context": "https://schema.org",
    "@type": "ImageObject",
    contentUrl: /^https?:\/\//.test(photo.src)
      ? photo.src
      : `${PHOTOS_URL}${photo.src.startsWith("/") ? "" : "/"}${photo.src}`,
    url: `${PHOTOS_URL}/photos/photo/${encodeURIComponent(photo.id)}`,
    ...(name && { name }),
    description: photo.description || photoAlt(photo),
    width: photo.width,
    height: photo.height,
    creator: { "@type": "Person", "@id": PERSON_ID, name: AUTHOR },
    creditText: AUTHOR,
    ...(validDate && { dateCreated: validDate }),
    ...(place && { contentLocation: { "@type": "Place", name: place } }),
    thumbnailUrl: photoShareImage(photo).url,
  };
}
