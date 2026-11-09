import type { PostMetadata } from "@/types/post";
import {
  placeById,
  type PlaceDefinition,
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

export interface PlaceGroup extends PlaceDefinition {
  posts: PostMetadata[];
  children: PlaceGroup[];
  count: number;
}

export function isPlaceEntry(
  post: Pick<PostMetadata, "title" | "isDraft" | "placeContext">
): boolean {
  if (
    post.isDraft ||
    post.placeContext === "transit" ||
    post.placeContext === "mention"
  )
    return false;
  if (post.placeContext === "visit") return true;
  return (
    !/^\s*[a-z]{2,4}\s*(?:->|→|✈)\s*[a-z]{2,4}\s*$/i.test(post.title) &&
    !/^\s*(?:flight day|flying to\b)/i.test(post.title)
  );
}

/** Explicit place parents never change when post counts or sibling counts change. */
export function groupTravelPosts(posts: PostMetadata[]): PlaceGroup[] {
  const nodes = new Map<string, PlaceGroup>();
  const ensure = (definition: PlaceDefinition): PlaceGroup => {
    const existing = nodes.get(definition.id);
    if (existing) return existing;
    const node = { ...definition, posts: [], children: [], count: 0 };
    nodes.set(node.id, node);
    if (definition.parentId) {
      const parent = placeById(definition.parentId);
      if (parent) ensure(parent).children.push(node);
    }
    return node;
  };
  for (const post of posts) {
    if (!isPlaceEntry(post)) continue;
    for (const definition of postTravelDestinations(
      parseLocations(post.locations)
    )) {
      const node = ensure(definition);
      if (!node.posts.some((p) => p.slug === post.slug)) node.posts.push(post);
    }
  }
  const finish = (node: PlaceGroup): Set<string> => {
    node.posts.sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
    node.children.sort((a, b) => a.label.localeCompare(b.label));
    const slugs = new Set(node.posts.map((post) => post.slug));
    for (const child of node.children)
      for (const slug of finish(child)) slugs.add(slug);
    node.count = slugs.size;
    return slugs;
  };
  const roots = [...nodes.values()]
    .filter((node) => !node.parentId)
    .sort((a, b) => a.label.localeCompare(b.label));
  roots.forEach(finish);
  return roots;
}
