import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PhotoStream } from "@/components/photos/PhotoStream";
import { getPhotosets } from "@/utils/content/photostream";
import { placeLine } from "@/utils/photoPlaces";
import { formatPhotoDate } from "@/utils/photoDate";

type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const collection = (await getPhotosets()).find((item) => item.slug === slug);
  return {
    title: `${collection?.title ?? "photos"} — Benedict Neo`,
    description: collection?.description,
    alternates: { canonical: `https://photos.bneo.xyz/photos/sets/${slug}` },
  };
}

export default async function PhotosetPage({ params }: Props) {
  const { slug } = await params;
  const collections = await getPhotosets();
  const index = collections.findIndex((item) => item.slug === slug);
  if (index === -1) notFound();
  const collection = collections[index];
  const days = [
    ...new Set(
      collection.photos.flatMap((photo) =>
        photo.date ? [photo.date.slice(0, 10)] : []
      )
    ),
  ].sort();
  return (
    <PhotoStream
      // A trip reads from its first day forward.
      photos={[...collection.photos].sort((a, b) =>
        (a.date ?? "").localeCompare(b.date ?? "")
      )}
      groupBy="day"
      header={
        <header className="ph-set-intro">
          <Link
            href={
              collection.parentSlug
                ? `/photos/sets/${collection.parentSlug}`
                : "/photos/trips"
            }
            className="ph-mono ph-back"
          >
            {collection.parentSlug ? "← Back to trip" : "← All trips"}
          </Link>
          <h1>{collection.title}</h1>
          {collection.description && <p>{collection.description}</p>}
          <p className="ph-mono ph-stats">
            {[
              `${collection.photos.length} ${collection.photos.length === 1 ? "frame" : "frames"}`,
              placeLine(collection.place),
              days.length > 0 &&
                `${days.length} ${days.length === 1 ? "day" : "days"}`,
              days.length > 0 &&
                `${formatPhotoDate(days[0])}${days.length > 1 ? ` — ${formatPhotoDate(days.at(-1))}` : ""}`,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {collection.sets && collection.sets.length > 1 && (
            <nav className="ph-tabs ph-mono" aria-label="Sets in this trip">
              {collection.sets.map((set) => (
                <Link key={set.slug} href={`/photos/sets/${set.slug}`}>
                  {set.title}
                </Link>
              ))}
            </nav>
          )}
        </header>
      }
    />
  );
}
