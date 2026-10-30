import { PHOTOS_URL } from "@/config/site";
import type { StreamPhoto } from "@/types/photostream";
import { placeTree } from "./photoPlaces";

// Must match each page's canonical (see photoShareMetadata `path`). /stream
// redirects, so it is left out.
export function photoSitemapUrls(
  photos: StreamPhoto[],
  setSlugs: string[]
): string[] {
  const paths = [
    "",
    "/places",
    ...placeTree(photos).flatMap((country) => [
      `/places/${country.slug}`,
      ...country.cities.map((city) => `/places/${country.slug}/${city.slug}`),
    ]),
    ...setSlugs.map((slug) => `/sets/${slug}`),
    ...photos.map((photo) => `/photo/${encodeURIComponent(photo.id)}`),
  ];
  return paths.map((path) => `${PHOTOS_URL}${path}`);
}
