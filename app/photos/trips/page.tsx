import type { Metadata } from "next";
import Link from "next/link";
import { FadeImage } from "@/components/photos/FadeImage";
import { formatMonth } from "@/components/photos/dates";
import { getPhotoCollections } from "@/utils/content/photostream";
import { placeLine } from "@/utils/photoPlaces";
import type { PhotoCollection } from "@/types/photostream";

export const metadata: Metadata = {
  title: "trips — photos",
  description: "Photos grouped by trip.",
  alternates: { canonical: "https://photos.bneo.xyz/photos/trips" },
};

function tripMonths(collection: PhotoCollection) {
  const dates = collection.photos.flatMap((p) => (p.date ? [p.date] : []));
  if (dates.length === 0) return undefined;
  dates.sort();
  const first = formatMonth(dates[0], "short");
  const last = formatMonth(dates.at(-1), "short");
  return first === last ? first : `${first} — ${last}`;
}

export default async function TripsPage() {
  const collections = await getPhotoCollections();
  return (
    <main className="ph-page">
      <section aria-labelledby="trips-heading" className="ph-section">
        <div className="ph-label ph-mono">
          <h2 id="trips-heading">Trips</h2>
          {collections.length > 0 && <span>{collections.length}</span>}
        </div>
        <div className="ph-sets">
          {collections.map((collection, index) => {
            const cover =
              collection.photos.find(
                (photo) => photo.id === collection.cover
              ) ?? collection.photos[0];
            return (
              <div key={collection.slug} className="ph-set">
                <Link href={`/photos/sets/${collection.slug}`} prefetch={false}>
                  <div className="ph-set-cover">
                    <FadeImage
                      src={cover.src}
                      alt={cover.caption}
                      fill
                      sizes="(max-width: 700px) 100vw, 400px"
                      quality={70}
                      preload={index === 0}
                      placeholder={cover.blurDataURL ? "blur" : "empty"}
                      blurDataURL={cover.blurDataURL}
                    />
                  </div>
                  <h3>{collection.title}</h3>
                  {collection.place && (
                    <p className="ph-mono ph-set-place">
                      {placeLine(collection.place)}
                    </p>
                  )}
                  <p className="ph-mono">
                    {[
                      `${collection.photos.length} ${collection.photos.length === 1 ? "frame" : "frames"}`,
                      tripMonths(collection),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </Link>
                {collection.sets && collection.sets.length > 1 && (
                  <p className="ph-subsets ph-mono">
                    {collection.sets.map((set) => (
                      <Link
                        key={set.slug}
                        href={`/photos/sets/${set.slug}`}
                        prefetch={false}
                      >
                        {set.title}
                      </Link>
                    ))}
                  </p>
                )}
              </div>
            );
          })}
        </div>
        {collections.length === 0 && <p className="ph-empty">No photos yet.</p>}
      </section>
    </main>
  );
}
