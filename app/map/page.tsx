import type { Metadata } from "next";
import data from "@/config/places.json";
import { placesSchema } from "@/utils/places";
import PlacesExplorer from "./PlacesExplorer";

export const metadata: Metadata = {
  title: "Places | Benedict Neo",
  description: "Places I love and notes from my travels.",
  alternates: { canonical: "https://maps.bneo.xyz" },
  openGraph: {
    title: "Places | Benedict Neo",
    description: "Places I love and notes from my travels.",
    url: "https://maps.bneo.xyz",
  },
};

export default function MapPage() {
  return <PlacesExplorer data={placesSchema.parse(data)} />;
}
