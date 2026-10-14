import type { PhotoCollection, StreamPhoto } from "@/types/photostream";

// "Spot, City, Country": parsed from the end, so shorter tags still work.
export function parsePlace(place?: string) {
  const parts = (place ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) return null;
  const country = parts.pop();
  const city = parts.pop();
  const spot = parts.join(", ") || undefined;
  return { spot, city, country };
}

export const placeSlug = (name: string) =>
  name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

// Photos inherit their trip's place unless they set their own (even "").
export function applyCollectionPlaces(collections: PhotoCollection[]) {
  return collections.map((collection) => {
    const inherit = (photo: StreamPhoto) => ({
      ...photo,
      place: photo.place ?? collection.place,
    });
    return {
      ...collection,
      photos: collection.photos.map(inherit),
      sets: collection.sets?.map((set) => ({
        ...set,
        photos: set.photos.map(inherit),
      })),
    };
  });
}

// Countries and cities by frame count. A photo with no city sits in a city
// named after its country.
export function placeTree(photos: StreamPhoto[]) {
  const countries = new Map<
    string,
    Map<string, { photos: StreamPhoto[]; spots: Set<string> }>
  >();
  for (const photo of photos) {
    const place = parsePlace(photo.place);
    if (!place?.country) continue;
    const cities = countries.get(place.country) ?? new Map();
    const name = place.city ?? place.country;
    const city = cities.get(name) ?? { photos: [], spots: new Set<string>() };
    city.photos.push(photo);
    if (place.spot) city.spots.add(place.spot);
    cities.set(name, city);
    countries.set(place.country, cities);
  }
  return [...countries]
    .map(([country, cities]) => {
      const list = [...cities]
        .map(([city, { photos, spots }]) => ({
          city,
          slug: placeSlug(city),
          count: photos.length,
          photos,
          spots: [...spots],
        }))
        .sort((a, b) => b.count - a.count);
      return {
        country,
        slug: placeSlug(country),
        count: list.reduce((sum, city) => sum + city.count, 0),
        cover: list[0].photos[0],
        cities: list,
      };
    })
    .sort((a, b) => b.count - a.count);
}

// "CHINATOWN · SAN FRANCISCO · UNITED STATES" (case comes from CSS).
export function placeLine(place?: string) {
  const parsed = parsePlace(place);
  if (!parsed) return undefined;
  return [parsed.spot, parsed.city, parsed.country].filter(Boolean).join(" · ");
}
