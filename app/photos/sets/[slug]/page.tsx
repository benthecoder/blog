import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { PhotoGrid } from "@/components/photos/PhotoGrid";
import { getPhotosets } from "@/utils/content/photostream";
import { formatPhotoDate } from "@/utils/photoDate";

type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() {
  return getPhotosets().map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const collection = getPhotosets().find((item) => item.slug === slug);
  return {
    title: `${collection?.title ?? "photos"} — Benedict Neo`,
    description: collection?.description,
    alternates: { canonical: `https://photos.bneo.xyz/photos/sets/${slug}` },
  };
}

export default async function PhotosetPage({ params }: Props) {
  const { slug } = await params;
  const collections = getPhotosets();
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
  const next = collections[index + 1];
  return (
    <main className="photo-set-page">
      <header className="photo-set-intro">
        <Link
          href={
            collection.parentSlug
              ? `/photos/sets/${collection.parentSlug}`
              : "/photos"
          }
          className="photo-back"
        >
          <ArrowLeft size={15} />{" "}
          {collection.parentSlug ? "Back to collection" : "All photosets"}
        </Link>
        <p className="photo-eyebrow">Collection</p>
        <h1>{collection.title}</h1>
        {collection.description && (
          <p className="photo-set-description">{collection.description}</p>
        )}
        <div className="photo-set-stats">
          <span>{collection.photos.length} photos</span>
          {days.length > 0 && (
            <span>
              {days.length} {days.length === 1 ? "day" : "days"}
            </span>
          )}
          {days.length > 0 && (
            <span>
              {formatPhotoDate(days[0])}
              {days.length > 1 && ` — ${formatPhotoDate(days.at(-1))}`}
            </span>
          )}
        </div>
        {collection.sets && collection.sets.length > 1 && (
          <nav className="photo-set-links" aria-label="Sets in this collection">
            {collection.sets.map((set) => (
              <Link key={set.slug} href={`/photos/sets/${set.slug}`}>
                {set.title} <ArrowRight size={13} />
              </Link>
            ))}
          </nav>
        )}
      </header>
      <PhotoGrid photos={collection.photos} mode="essay" />
      {next && (
        <Link href={`/photos/sets/${next.slug}`} className="photo-next-set">
          <span>
            Next collection
            <br />
            <strong>{next.title}</strong>
          </span>
          <ArrowRight size={24} />
        </Link>
      )}
    </main>
  );
}
