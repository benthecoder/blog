import type { PostMetadata } from "@/types/post";
import {
  compareDestinations,
  postTravelDestinations,
  travelDestination,
} from "@/config/travel";

export function travelPlaceId(place: string): string {
  return `place-${place
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-|-$/g, "")}`;
}

export function legacyTravelDestination(tag: string): string | undefined {
  const places: Record<string, string> = {
    sf: "San Francisco",
    sea: "Seattle",
    atx: "Austin",
    mia: "Miami",
    tpe: "Taipei",
    boston: "Boston",
  };
  const place = places[tag.toLowerCase()];
  return place ? travelDestination(place).label : undefined;
}

/** Destinations are explicit metadata, not guesses from topic tags or titles. */
export function parseLocations(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const aliases: Record<string, string> = {
    "Yosemite National Park": "Yosemite",
    "Muir Woods National Monument": "Muir Woods",
    "Carlsbad Caverns": "Carlsbad Caverns National Park",
    "Alcatraz Island": "San Francisco",
    "Angel Island State Park": "Angel Island",
  };
  return [
    ...new Set(
      value
        .filter((v): v is string => typeof v === "string")
        .map((v) => aliases[v.trim()] ?? v.trim())
        .filter(Boolean)
    ),
  ];
}

export interface TravelRegion {
  label: string;
  destinations: { label: string; posts: PostMetadata[] }[];
}

export function groupTravelPosts(posts: PostMetadata[]): TravelRegion[] {
  const regions = new Map<string, Map<string, Map<string, PostMetadata>>>();
  for (const post of posts) {
    if (post.isDraft) continue;
    for (const { region, label } of postTravelDestinations(
      parseLocations(post.locations)
    )) {
      const destinations =
        regions.get(region) ?? new Map<string, Map<string, PostMetadata>>();
      const entries =
        destinations.get(label) ?? new Map<string, PostMetadata>();
      entries.set(post.slug, post);
      destinations.set(label, entries);
      regions.set(region, destinations);
    }
  }
  return [...regions]
    .map(([label, destinations]) => ({
      label,
      destinations: [...destinations]
        .sort(([a], [b]) => compareDestinations(a, b))
        .map(([place, entries]) => ({
          label: place,
          posts: [...entries.values()].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          ),
        })),
    }))
    .sort((a, b) => {
      const name = (region: TravelRegion) =>
        region.destinations.length === 1
          ? region.destinations[0].label
          : region.label;
      return name(a).localeCompare(name(b));
    });
}
