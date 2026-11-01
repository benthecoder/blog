export interface PlaceDefinition {
  id: string;
  label: string;
  kind:
    | "country"
    | "territory"
    | "region"
    | "area"
    | "city"
    | "park"
    | "collection";
  parentId?: string;
  aliases?: readonly string[];
  /** Approximate browsing centres, not personal GPS coordinates. */
  coordinates?: readonly [number, number];
}

/** One hierarchy drives archive headings, map markers, aliases, and overlap handling. */
export const PLACE_DEFINITIONS: readonly PlaceDefinition[] = [
  { id: "united-states", label: "United States", kind: "country" },
  {
    id: "california",
    label: "California",
    kind: "region",
    parentId: "united-states",
  },
  {
    id: "san-francisco-bay-area",
    label: "San Francisco Bay Area",
    kind: "area",
    parentId: "california",
    coordinates: [-122.4194, 37.7749],
    aliases: [
      "San Francisco",
      "San Jose",
      "Berkeley",
      "Angel Island",
      "Marin County",
      "Mill Valley",
      "Mountain View",
      "Pacifica",
      "Palo Alto",
      "Pleasanton",
      "Sausalito",
      "Los Gatos",
      "Henry Cowell Redwoods State Park",
    ],
  },
  {
    id: "muir-woods",
    label: "Muir Woods",
    kind: "park",
    parentId: "san-francisco-bay-area",
    coordinates: [-122.5811, 37.8978],
  },
  {
    id: "yosemite",
    label: "Yosemite",
    kind: "park",
    parentId: "california",
    coordinates: [-119.5383, 37.8651],
  },
  {
    id: "napa-valley",
    label: "Napa Valley",
    kind: "area",
    parentId: "california",
    coordinates: [-122.2869, 38.2975],
  },
  {
    id: "monterey",
    label: "Monterey",
    kind: "city",
    parentId: "california",
    aliases: ["Carmel-by-the-Sea"],
    coordinates: [-121.8947, 36.6002],
  },
  { id: "texas", label: "Texas", kind: "region", parentId: "united-states" },
  {
    id: "austin-central-texas",
    label: "Austin & Central Texas",
    kind: "area",
    parentId: "texas",
    aliases: ["Austin", "Waco", "Round Rock", "Salado"],
    coordinates: [-97.7431, 30.2672],
  },
  {
    id: "dallas",
    label: "Dallas",
    kind: "city",
    parentId: "texas",
    coordinates: [-96.797, 32.7767],
  },
  {
    id: "san-antonio",
    label: "San Antonio",
    kind: "city",
    parentId: "texas",
    coordinates: [-98.4936, 29.4241],
  },
  {
    id: "massachusetts",
    label: "Massachusetts",
    kind: "region",
    parentId: "united-states",
  },
  {
    id: "boston",
    label: "Boston",
    kind: "city",
    parentId: "massachusetts",
    aliases: ["Cambridge"],
    coordinates: [-71.0589, 42.3601],
  },
  {
    id: "new-mexico",
    label: "New Mexico",
    kind: "region",
    parentId: "united-states",
  },
  {
    id: "santa-fe",
    label: "Santa Fe",
    kind: "city",
    parentId: "new-mexico",
    coordinates: [-105.9378, 35.687],
  },
  {
    id: "carlsbad-caverns-national-park",
    label: "Carlsbad Caverns National Park",
    kind: "park",
    parentId: "new-mexico",
    coordinates: [-104.5567, 32.1479],
  },
  {
    id: "florida",
    label: "Florida",
    kind: "region",
    parentId: "united-states",
  },
  {
    id: "miami",
    label: "Miami",
    kind: "city",
    parentId: "florida",
    aliases: ["Key Biscayne"],
    coordinates: [-80.1918, 25.7617],
  },
  {
    id: "orlando",
    label: "Orlando",
    kind: "city",
    parentId: "florida",
    coordinates: [-81.3792, 28.5383],
  },
  {
    id: "marco-island",
    label: "Marco Island",
    kind: "city",
    parentId: "florida",
    coordinates: [-81.714, 25.94],
  },
  {
    id: "washington",
    label: "Washington",
    kind: "region",
    parentId: "united-states",
  },
  {
    id: "seattle",
    label: "Seattle",
    kind: "city",
    parentId: "washington",
    coordinates: [-122.3321, 47.6062],
  },
  {
    id: "colorado",
    label: "Colorado",
    kind: "region",
    parentId: "united-states",
  },
  {
    id: "denver",
    label: "Denver",
    kind: "city",
    parentId: "colorado",
    coordinates: [-104.9903, 39.7392],
  },
  { id: "iowa", label: "Iowa", kind: "region", parentId: "united-states" },
  {
    id: "des-moines",
    label: "Des Moines",
    kind: "city",
    parentId: "iowa",
    coordinates: [-93.625, 41.59],
  },
  {
    id: "washington-d-c",
    label: "Washington, D.C.",
    kind: "region",
    parentId: "united-states",
    coordinates: [-77.0369, 38.9072],
  },
  {
    id: "yellowstone",
    label: "Yellowstone",
    kind: "park",
    parentId: "united-states",
    coordinates: [-110.5885, 44.428],
  },
  { id: "canada", label: "Canada", kind: "country" },
  { id: "ontario", label: "Ontario", kind: "region", parentId: "canada" },
  {
    id: "toronto",
    label: "Toronto",
    kind: "city",
    parentId: "ontario",
    coordinates: [-79.3832, 43.6532],
  },
  { id: "china", label: "China", kind: "country" },
  { id: "guangdong", label: "Guangdong", kind: "region", parentId: "china" },
  {
    id: "shenzhen",
    label: "Shenzhen",
    kind: "city",
    parentId: "guangdong",
    coordinates: [114.0579, 22.5431],
  },
  {
    id: "hong-kong",
    label: "Hong Kong",
    kind: "territory",
    coordinates: [114.1694, 22.3193],
  },
  {
    id: "taiwan",
    label: "Taiwan",
    kind: "country",
    aliases: ["Taipei", "Jiufen", "Yilan"],
    coordinates: [121, 23.7],
  },
  {
    id: "malaysia",
    label: "Malaysia",
    kind: "country",
    aliases: ["Kuala Lumpur", "Johor", "Johor Bahru", "Port Dickson"],
    coordinates: [101.6869, 3.139],
  },
  { id: "other-places", label: "Other places", kind: "collection" },
];
const byId = new Map(PLACE_DEFINITIONS.map((place) => [place.id, place]));
const byName = new Map<string, PlaceDefinition>();
for (const place of PLACE_DEFINITIONS) {
  if (place.parentId && !byId.has(place.parentId))
    throw Error(`Unknown parent: ${place.id}`);
  const seen = new Set<string>();
  let current: PlaceDefinition | undefined = place;
  while (current) {
    if (seen.has(current.id))
      throw Error(`Cyclic place hierarchy: ${place.id}`);
    seen.add(current.id);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  for (const name of [place.label, ...(place.aliases ?? [])])
    byName.set(name.trim().toLowerCase(), place);
}
export function placeById(id: string): PlaceDefinition | undefined {
  return byId.get(id);
}
export function travelDestination(name: string): PlaceDefinition {
  return (
    byName.get(name.trim().toLowerCase()) ?? {
      id: name
        .normalize("NFKD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, "-")
        .replace(/^-|-$/g, ""),
      label: name,
      kind: "area",
      parentId: "other-places",
    }
  );
}
export function postTravelDestinations(places: string[]): PlaceDefinition[] {
  const unique = [
    ...new Map(
      places.map((place) => {
        const d = travelDestination(place);
        return [d.id, d];
      })
    ).values(),
  ];
  // Prefer a specifically recorded child over its broad ancestor in the same post.
  return unique.filter(
    (candidate) =>
      !unique.some((other) => {
        let parent = other.parentId;
        while (parent) {
          if (parent === candidate.id) return true;
          parent = byId.get(parent)?.parentId;
        }
        return false;
      })
  );
}
