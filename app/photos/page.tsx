import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PhotoGrid } from "@/components/photos/PhotoGrid";
import {
  getPhotoCollections,
  getPhotostream,
} from "@/utils/content/photostream";

export const metadata: Metadata = {
  title: "photos",
  description: "Photostream and photosets.",
  alternates: { canonical: "https://photos.bneo.xyz" },
  openGraph: { title: "photos", url: "https://photos.bneo.xyz" },
};

export default function PhotosPage() {
  const collections = getPhotoCollections();
  const photos = getPhotostream();
  return (
    <main className="photo-index">
      <header className="photo-intro">
        <h1>Photos</h1>
      </header>
      <section aria-labelledby="stream-heading" className="photo-recent">
        <div className="photo-section-heading">
          <h2 id="stream-heading">
            <Link href="/photos/stream">Photostream</Link>
          </h2>
          <Link href="/photos/stream">View all</Link>
        </div>
        <PhotoGrid photos={photos.slice(0, 12)} mode="rail" />
      </section>
      <section aria-labelledby="sets-heading">
        <div className="photo-section-heading">
          <h2 id="sets-heading">Photosets</h2>
          {collections.length > 0 && (
            <span>
              {collections.length}{" "}
              {collections.length === 1 ? "collection" : "collections"}
            </span>
          )}
        </div>
        <div className="photo-collections">
          {collections.map((collection, index) => {
            const cover =
              collection.photos.find(
                (photo) => photo.id === collection.cover
              ) ?? collection.photos[0];
            return (
              <div key={collection.slug}>
                <Link
                  href={`/photos/sets/${collection.slug}`}
                  className="photo-cover"
                  prefetch={false}
                >
                  <div className="photo-cover-image">
                    <Image
                      src={cover.src}
                      alt={cover.caption}
                      fill
                      sizes="(max-width: 800px) 100vw, 860px"
                      quality={75}
                      preload={index === 0}
                      placeholder={cover.blurDataURL ? "blur" : "empty"}
                      blurDataURL={cover.blurDataURL}
                    />
                  </div>
                  <div className="photo-cover-caption">
                    <span className="photo-eyebrow">Collection</span>
                    <h3>{collection.title}</h3>
                    {collection.description && <p>{collection.description}</p>}
                    <span className="photo-cover-count">
                      {collection.photos.length} photos
                    </span>
                  </div>
                </Link>
                {collection.sets && collection.sets.length > 1 && (
                  <div className="photo-subsets">
                    {collection.sets.map((set) => (
                      <Link
                        key={set.slug}
                        href={`/photos/sets/${set.slug}`}
                        prefetch={false}
                      >
                        <div>
                          <Image
                            src={set.photos[0].src}
                            alt=""
                            fill
                            sizes="(max-width: 700px) 45vw, 280px"
                            quality={65}
                          />
                        </div>
                        <span>{set.title}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {collections.length === 0 && (
          <p className="photo-empty">
            A few moments worth keeping. The first collection is on its way.
          </p>
        )}
      </section>
    </main>
  );
}
