import type { PlacesData } from "@/utils/places";

const MAP_URL = "https://maps.bneo.xyz";

/** Map links for the places and lists whose `post` is this slug. */
export function placesForPost(data: PlacesData, slug: string) {
  const links = new Map<string, string>();
  const add = (href: string, name: string) => {
    if (!links.has(href)) links.set(href, name);
  };
  data.collections.forEach((collection) => {
    const list = `${MAP_URL}/?list=${encodeURIComponent(collection.id)}`;
    if (collection.post === slug) add(list, collection.title);
    collection.entries.forEach((entry) => {
      if (entry.post !== slug) return;
      const place = data.places.find((p) => p.id === entry.placeId);
      if (place)
        add(`${list}&place=${encodeURIComponent(place.id)}`, place.name);
    });
  });
  return [...links].map(([href, name]) => ({ name, href }));
}
