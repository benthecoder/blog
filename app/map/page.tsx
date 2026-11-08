import type { Metadata, Viewport } from "next";
import { preconnect } from "react-dom";
import data from "@/config/places.json";
import { placesSchema } from "@/utils/places";
import {
  OG_IMAGE_HEIGHT,
  OG_IMAGE_WIDTH,
  ogImageUrl,
} from "@/utils/pageMetadata";
import PlacesExplorer from "./PlacesExplorer";

const description = "Places I love and notes from my travels.";

export const metadata: Metadata = {
  title: "Places | Benedict Neo",
  description,
  alternates: { canonical: "https://maps.bneo.xyz" },
  openGraph: {
    title: "Places | Benedict Neo",
    description,
    url: "https://maps.bneo.xyz",
    images: [
      {
        url: ogImageUrl("Places"),
        width: OG_IMAGE_WIDTH,
        height: OG_IMAGE_HEIGHT,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    creator: "@benedictneo",
    title: "Places | Benedict Neo",
    description,
    images: [ogImageUrl("Places")],
  },
};

// Draw under the notch and home indicator; map.css pads with env(safe-area-*).
export const viewport: Viewport = { viewportFit: "cover" };

export default function MapPage() {
  // The map style and tiles come from OpenFreeMap; warming the connection
  // here hides most of the wait behind the page render.
  preconnect("https://tiles.openfreemap.org");
  return <PlacesExplorer data={placesSchema.parse(data)} intro={description} />;
}
