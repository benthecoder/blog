import type { Metadata } from "next";
import { preconnect } from "react-dom";
import { Zen_Old_Mincho } from "next/font/google";
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

// Mincho for names and the title, like the type on an old printed map.
const mincho = Zen_Old_Mincho({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-mincho",
  display: "swap",
});

export default function MapPage() {
  // The map style and tiles come from OpenFreeMap; warming the connection
  // here hides most of the wait behind the page render.
  preconnect("https://tiles.openfreemap.org");
  return (
    <div className={mincho.variable}>
      <PlacesExplorer data={placesSchema.parse(data)} />
    </div>
  );
}
