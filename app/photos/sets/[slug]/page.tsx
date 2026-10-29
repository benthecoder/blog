import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PhotoStream } from "@/components/photos/PhotoStream";
import { getPhotosets } from "@/utils/content/photostream";
import { photoShareMetadata } from "@/utils/photoShare";
import { placeLine } from "@/utils/photoPlaces";
import { formatPhotoDate } from "@/utils/photoDate";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const collection = (await getPhotosets()).find((item) => item.slug === slug);
  const count = collection?.photos.length ?? 0;
  return photoShareMetadata({
    title: `${collection?.title ?? "photos"} — Benedict Neo`,
    description:
      collection?.description ??
      (collection && `${count} ${count === 1 ? "frame" : "frames"}.`),
    path: `/sets/${slug}`,
    photo:
      collection?.photos.find(
        (photo) =>
          photo.id === collection.cover || photo.src === collection.cover
      ) ?? collection?.photos[0],
  });
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
      // A set reads from its first day forward.
      photos={[...collection.photos].sort((a, b) =>
        (a.date ?? "").localeCompare(b.date ?? "")
      )}
      groupBy="day"
      header={
        <header className="ph-set-intro">
          <Link
            href={
              collection.parentSlug
                ? `/sets/${collection.parentSlug}`
                : "/places"
            }
            className="ph-mono ph-back"
          >
            {collection.parentSlug ? "← Back" : "← All places"}
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
                <Link key={set.slug} href={`/sets/${set.slug}`}>
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
