import { z } from "zod";

export const categories = ["food", "cafes", "art", "shop", "outdoors"] as const;
export type Category = (typeof categories)[number];
const id = z.string().regex(/^[a-z0-9-]+$/);
const date = z.iso.date();
const entrySchema = z.object({
  placeId: id,
  note: z.string().optional(),
  visitedOn: date.optional(),
  post: id.optional(),
});
const placeSchema = z.object({
  id,
  name: z.string().min(1),
  coordinates: z.tuple([
    z.number().min(-180).max(180),
    z.number().min(-90).max(90),
  ]),
  address: z.string(),
  tags: z.array(z.enum(categories)).min(1),
  note: z.string(),
  googlePlaceId: z.string().optional(),
  source: z.url().optional(),
});
const collectionSchema = z.object({
  id,
  title: z.string().min(1),
  kind: z.enum(["list", "trip"]),
  description: z.string(),
  location: z.string().optional(),
  date: date.optional(),
  source: z.url().optional(),
  post: id.optional(),
  entries: z.array(entrySchema).min(1),
});
export const placesSchema = z
  .object({
    updated: date,
    places: z.array(placeSchema),
    collections: z.array(collectionSchema).min(1),
  })
  .superRefine((data, context) => {
    const placeIds = new Set(data.places.map((p) => p.id));
    if (placeIds.size !== data.places.length)
      context.addIssue({ code: "custom", message: "Duplicate place IDs" });
    if (
      new Set(data.collections.map((c) => c.id)).size !==
      data.collections.length
    )
      context.addIssue({ code: "custom", message: "Duplicate collection IDs" });
    data.collections.forEach((c) => {
      if (new Set(c.entries.map((e) => e.placeId)).size !== c.entries.length)
        context.addIssue({
          code: "custom",
          message: `Duplicate places in ${c.id}`,
        });
      c.entries.forEach((e) => {
        if (!placeIds.has(e.placeId))
          context.addIssue({
            code: "custom",
            message: `Unknown place ${e.placeId}`,
          });
      });
    });
  });
export type PlacesData = z.infer<typeof placesSchema>;
export type Place = z.infer<typeof placeSchema>;
export type Collection = z.infer<typeof collectionSchema>;
type CollectionEntry = z.infer<typeof entrySchema>;
export type Visit = Place & Pick<CollectionEntry, "visitedOn" | "post">;

export function filterPlaces(
  places: Visit[],
  selectedCategories: Category[],
  query: string
): Visit[] {
  const search = query.trim().toLowerCase();
  return places.filter(
    (place) =>
      (!selectedCategories.length ||
        selectedCategories.some((category) => place.tags.includes(category))) &&
      `${place.name} ${place.note} ${place.address}`
        .toLowerCase()
        .includes(search)
  );
}

export function readMapSelection(data: PlacesData, params: URLSearchParams) {
  const collection = data.collections.find((c) => c.id === params.get("list"));
  const placeId = params.get("place");
  return {
    collectionId: collection?.id ?? null,
    placeId: collection?.entries.some((e) => e.placeId === placeId)
      ? placeId
      : null,
  };
}

export function collectionPlaces(
  data: PlacesData,
  collection: Collection
): Visit[] {
  return collection.entries.map((entry) => {
    const place = data.places.find((p) => p.id === entry.placeId)!;
    return {
      ...place,
      note: entry.note ?? place.note,
      visitedOn: entry.visitedOn,
      post: entry.post ?? collection.post,
    };
  });
}
export function mapsUrl(place: Place) {
  const url = new URL("https://www.google.com/maps/search/");
  url.searchParams.set("api", "1");
  url.searchParams.set(
    "query",
    `${place.coordinates[1]},${place.coordinates[0]}`
  );
  if (place.googlePlaceId)
    url.searchParams.set("query_place_id", place.googlePlaceId);
  return url.toString();
}
export function placesGeoJSON(places: Visit[]) {
  return {
    type: "FeatureCollection" as const,
    features: places.map((place, index) => ({
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: place.coordinates },
      properties: {
        id: place.id,
        name: place.name,
        note: place.note,
        address: place.address,
        tags: place.tags,
        visitedOn: place.visitedOn ?? "",
        post: place.post ?? "",
        category: place.tags[0],
        // 1-based position in the list the visitor sees, so the number
        // printed inside a map station matches the index beside it.
        station: String(index + 1),
      },
    })),
  };
}

const GRID_COLS = "ABCDE";
/**
 * Printed-map grid reference ("B2") for a place, on a 5x5 grid stretched
 * over the bounds of the set it belongs to. Columns run west to east,
 * rows north to south, like the index of a folded sheet map. Computed
 * against the whole set (not a filtered view) so a reference stays put
 * while the visitor filters.
 */
export function gridReference(
  place: Pick<Place, "coordinates">,
  places: Pick<Place, "coordinates">[]
): string {
  if (places.length < 2) return "C3";
  const lngs = places.map((p) => p.coordinates[0]);
  const lats = places.map((p) => p.coordinates[1]);
  const minLng = Math.min(...lngs);
  const maxLat = Math.max(...lats);
  const colSpan = (Math.max(...lngs) - minLng) / 5 || 1;
  const rowSpan = (maxLat - Math.min(...lats)) / 5 || 1;
  const col = Math.min(
    4,
    Math.max(0, Math.floor((place.coordinates[0] - minLng) / colSpan))
  );
  const row = Math.min(
    4,
    Math.max(0, Math.floor((maxLat - place.coordinates[1]) / rowSpan))
  );
  return `${GRID_COLS[col]}${row + 1}`;
}
const xml = (value: string) =>
  value.replace(
    /[<>&"']/g,
    (c) =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        '"': "&quot;",
        "'": "&apos;",
      })[c]!
  );
export function placesKML(title: string, places: Visit[]) {
  return `<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>${xml(title)}</name>${places.map((p) => `<Placemark><name>${xml(p.name)}</name><description>${xml([p.note, p.visitedOn, p.post && `https://bneo.xyz/posts/${p.post}`].filter(Boolean).join("\n"))}</description><Point><coordinates>${p.coordinates.join(",")},0</coordinates></Point></Placemark>`).join("")}</Document></kml>`;
}
