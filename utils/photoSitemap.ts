import { PHOTOS_URL } from "@/config/site";
import type { StreamPhoto } from "@/types/photostream";
import { placeTree } from "./photoPlaces";

// Must match each page's canonical (see photoShareMetadata `path`). /photos/stream
// redirects, so it is left out.
export function photoSitemapUrls(
  photos: StreamPhoto[],
  setSlugs: string[]
): string[] {
  const paths = [
    "",
    "/photos/places",
    ...placeTree(photos).flatMap((country) => [
      `/photos/places/${country.slug}`,
      ...country.cities.map(
        (city) => `/photos/places/${country.slug}/${city.slug}`
      ),
    ]),
    ...setSlugs.map((slug) => `/photos/sets/${slug}`),
    ...photos.map((photo) => `/photos/photo/${encodeURIComponent(photo.id)}`),
  ];
  return paths.map((path) => `${PHOTOS_URL}${path}`);
}
