interface Destination {
  region: string;
  label: string;
}

// Browsing buckets, not geotags: precise visited places stay in frontmatter.
const destinations: Record<string, Destination> = {};
function bucket(region: string, label: string, places: string[]) {
  for (const place of places) destinations[place] = { region, label };
}

bucket("California", "San Francisco Bay Area", [
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
]);
bucket("California", "Yosemite", ["Yosemite"]);
bucket("California", "Muir Woods", ["Muir Woods"]);
bucket("California", "Napa Valley", ["Napa Valley"]);
bucket("California", "Monterey", ["Monterey", "Carmel-by-the-Sea"]);
bucket("Texas", "Austin & Central Texas", [
  "Austin",
  "Waco",
  "Round Rock",
  "Salado",
]);
bucket("Texas", "Dallas", ["Dallas"]);
bucket("Texas", "San Antonio", ["San Antonio"]);
bucket("Taiwan", "Taiwan", ["Taiwan", "Taipei", "Jiufen", "Yilan"]);
bucket("Malaysia", "Malaysia", [
  "Malaysia",
  "Kuala Lumpur",
  "Johor",
  "Johor Bahru",
  "Port Dickson",
]);
bucket("Massachusetts", "Boston", ["Boston", "Cambridge"]);
bucket("New Mexico", "Santa Fe", ["Santa Fe"]);
bucket("New Mexico", "Carlsbad Caverns National Park", [
  "Carlsbad Caverns National Park",
]);
bucket("Florida", "Miami", ["Miami", "Key Biscayne"]);
bucket("Florida", "Orlando", ["Orlando"]);
bucket("Florida", "Marco Island", ["Marco Island"]);

export function travelDestination(place: string): Destination {
  return destinations[place] ?? { region: place, label: place };
}

// Keep a whole California trip together when it also passes through the city.
export function postTravelDestinations(places: string[]): Destination[] {
  const unique = [
    ...new Map(
      places.map((place) => {
        const destination = travelDestination(place);
        return [
          `${destination.region}/${destination.label}`,
          destination,
        ] as const;
      })
    ).values(),
  ];
  const hasCaliforniaTrip = unique.some(
    (d) => d.region === "California" && d.label !== "San Francisco Bay Area"
  );
  return unique.filter(
    (d) => !(hasCaliforniaTrip && d.label === "San Francisco Bay Area")
  );
}

const californiaOrder = [
  "San Francisco Bay Area",
  "Yosemite",
  "Muir Woods",
  "Napa Valley",
  "Monterey",
];
export function compareDestinations(a: string, b: string): number {
  const ai = californiaOrder.indexOf(a),
    bi = californiaOrder.indexOf(b);
  return ai !== -1 && bi !== -1 ? ai - bi : a.localeCompare(b);
}
