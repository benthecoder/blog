import type { Metadata } from "next";
import Link from "next/link";
import { CityRows } from "@/components/photos/CityRows";
import { getPhotostream } from "@/utils/content/photostream";
import { placeTree } from "@/utils/photoPlaces";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "places — photos",
  description: "Photos by country and city.",
  alternates: { canonical: "https://photos.bneo.xyz/photos/places" },
};

const count = (n: number, one: string, many = `${one}s`) =>
  `${n} ${n === 1 ? one : many}`;

export default async function PlacesPage() {
  const photos = await getPhotostream();
  const countries = placeTree(photos);
  const placed = countries.reduce((sum, country) => sum + country.count, 0);
  return (
    <main className="ph-page">
      <h1 className="ph-sr">Places</h1>
      {countries.map((country) => (
        <section key={country.slug} className="ph-section">
          <h2 className="ph-country">
            <Link href={`/photos/places/${country.slug}`}>
              {country.country}
            </Link>
          </h2>
          <p className="ph-mono ph-stats">
            {count(country.count, "frame")} ·{" "}
            {count(country.cities.length, "city", "cities")}
          </p>
          <CityRows country={country} />
        </section>
      ))}
      {countries.length === 0 && <p className="ph-empty">No places yet.</p>}
      {photos.length > placed && (
        <p className="ph-mono ph-unplaced">
          {count(photos.length - placed, "frame")} without a place
        </p>
      )}
    </main>
  );
}
