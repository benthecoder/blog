import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PhotoStream } from "@/components/photos/PhotoStream";
import { monthRange } from "@/components/photos/dates";
import { getPhotostream } from "@/utils/content/photostream";
import { placeTree } from "@/utils/photoPlaces";

type Props = { params: Promise<{ country: string; city: string }> };

async function findCity(countrySlug: string, citySlug: string) {
  const country = placeTree(await getPhotostream()).find(
    (item) => item.slug === countrySlug
  );
  const city = country?.cities.find((item) => item.slug === citySlug);
  return country && city ? { country, city } : undefined;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country, city } = await params;
  const found = await findCity(country, city);
  return {
    title: `${found?.city.city ?? "places"} — photos`,
    description: found && `Photos from ${found.city.city}.`,
    alternates: {
      canonical: `https://photos.bneo.xyz/photos/places/${country}/${city}`,
    },
  };
}

export default async function CityPage({ params }: Props) {
  const { country: countrySlug, city: citySlug } = await params;
  const found = await findCity(countrySlug, citySlug);
  if (!found) notFound();
  const { country, city } = found;
  return (
    <PhotoStream
      photos={city.photos}
      header={
        <header className="ph-set-intro">
          <Link
            href={`/photos/places/${country.slug}`}
            className="ph-mono ph-back"
          >
            {`← ${country.country}`}
          </Link>
          <h1>{city.city}</h1>
          <p className="ph-mono ph-stats">
            {[
              `${city.count} ${city.count === 1 ? "frame" : "frames"}`,
              monthRange(city.photos),
              city.spots.join(" · "),
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </header>
      }
    />
  );
}
