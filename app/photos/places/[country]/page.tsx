import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PhotoGallery } from "@/components/photos/ContactSheet";
import { getPhotostream } from "@/utils/content/photostream";
import { placeTree } from "@/utils/photoPlaces";

type Props = { params: Promise<{ country: string }> };

const count = (n: number, one: string, many = `${one}s`) =>
  `${n} ${n === 1 ? one : many}`;

async function findCountry(slug: string) {
  return placeTree(await getPhotostream()).find((item) => item.slug === slug);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country: slug } = await params;
  const country = await findCountry(slug);
  return {
    title: `${country?.country ?? "places"} — photos`,
    description:
      country && `${count(country.count, "frame")} in ${country.country}.`,
    alternates: {
      canonical: `https://photos.bneo.xyz/photos/places/${slug}`,
    },
  };
}

export default async function CountryPage({ params }: Props) {
  const { country: slug } = await params;
  const country = await findCountry(slug);
  if (!country) notFound();
  return (
    <main className="ph-page">
      <header className="ph-set-intro">
        <Link href="/photos/places" className="ph-mono ph-back">
          ← All places
        </Link>
        <h1>{country.country}</h1>
        <p className="ph-mono ph-stats">
          {count(country.count, "frame")} ·{" "}
          {count(country.cities.length, "city", "cities")}
        </p>
      </header>
      {country.cities.map((city) => (
        <section key={city.slug} id={city.slug} className="ph-city-section">
          <h2 className="ph-month ph-mono">
            <span>{city.city}</span>
            <span>{count(city.count, "frame")}</span>
          </h2>
          {city.spots.length > 0 && (
            <p className="ph-mono ph-spots">{city.spots.join(" · ")}</p>
          )}
          <PhotoGallery photos={city.photos} />
        </section>
      ))}
    </main>
  );
}
