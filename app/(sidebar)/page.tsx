import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { QuoteFooter } from "@/components/layout/QuoteFooter";
import { getQuotes } from "@/utils/content/quotes";
import { SKETCHES } from "@/config/sketches";
import { getPostMetadata } from "@/utils/content/posts";
import { getPhotostream } from "@/utils/content/photostream";
import { photoAlt, photoTitle } from "@/utils/photoCaption";
import { parsePlace } from "@/utils/photoPlaces";
import { formatPhotoDate } from "@/utils/photoDate";
import { filmFor } from "@/utils/photoFilm";
import type { StreamPhoto } from "@/types/photostream";

// Photos are live; refresh hourly so new uploads reach the homepage.
export const revalidate = 3600;

export const metadata: Metadata = { alternates: { canonical: "/" } };

const FEATURED_SKETCHES = ["howl.png", "wave.png", "peony.png"].flatMap(
  (file) => SKETCHES.filter((sketch) => sketch.file === file)
);
const entryLink =
  "text-accent hover:underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent";

const formatCount = (n: number) => n.toLocaleString("en-US");

function RecentWritings() {
  const posts = getPostMetadata();
  return (
    <section aria-labelledby="writings">
      <h2 id="writings" className="mb-4 text-base font-bold text-primary">
        recent writings
      </h2>
      <ul className="space-y-4">
        {posts.slice(0, 5).map((post) => (
          <li key={post.slug}>
            <h3 className="text-base">
              <Link href={`/posts/${post.slug}`} className={entryLink}>
                {post.title}
              </Link>
            </h3>
            <p className="mt-1 text-xs text-muted">{post.date}</p>
          </li>
        ))}
      </ul>
      <p className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <Link href="/posts" className={`${entryLink} text-muted`}>
          all writings →
        </Link>
        <Link href="/explore" className={`${entryLink} text-muted`}>
          how all {formatCount(posts.length)} entries connect →
        </Link>
      </p>
    </section>
  );
}

type Tile = {
  key: string;
  href: string;
  src: string;
  alt: string;
  ink?: boolean;
};

function Gallery({
  id,
  title,
  tiles,
  more,
}: {
  id: string;
  title: string;
  tiles: Tile[];
  more: { href: string; label: string };
}) {
  return (
    <section aria-labelledby={id} className="mt-10">
      <h2 id={id} className="mb-4 text-base font-bold text-primary">
        {title}
      </h2>
      <ul className="grid grid-cols-3 gap-2">
        {tiles.map((tile) => (
          <li key={tile.key}>
            <Link
              href={tile.href}
              className="relative block aspect-square overflow-hidden rounded-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <Image
                src={tile.src}
                alt={tile.alt}
                fill
                sizes="(max-width: 640px) 33vw, 200px"
                className={`object-cover transition-opacity hover:opacity-80${tile.ink ? " sketch-ink" : ""}`}
              />
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm">
        <Link href={more.href} className={`${entryLink} text-muted`}>
          {more.label} →
        </Link>
      </p>
    </section>
  );
}

/** Written on the print's strip: its caption, else where it was taken. */
function printLabel(photo: StreamPhoto) {
  const place = parsePlace(photo.place);
  return (
    photoTitle(photo) ??
    (place && (place.city ?? place.country)) ??
    formatPhotoDate(photo.date)
  );
}

/** The latest photos as a fanned row of instant prints, as in posts. */
function Prints({ photos }: { photos: StreamPhoto[] }) {
  return (
    <section aria-labelledby="photos" className="mt-10">
      <h2 id="photos" className="mb-4 text-base font-bold text-primary">
        photos
      </h2>
      {/* Held to the column: in a post a row of prints spreads into the
          margins, but here it sits beside the sketches at their width. */}
      <div className="photo-group" style={{ margin: "1.5rem 0 0" }}>
        <div className="photo-row" data-n={photos.length}>
          {photos.map((photo) => {
            const [width, height] = filmFor(photo);
            return (
              <figure
                key={photo.id}
                className="photo-print"
                style={
                  {
                    "--plate-ratio": `${width} / ${height}`,
                    "--plate-ar": width / height,
                  } as React.CSSProperties
                }
              >
                <Link
                  href={`/photos/photo/${photo.id}`}
                  className="photo-frame block w-full outline-none"
                >
                  <div className="photo-plate relative w-full overflow-hidden">
                    <Image
                      src={photo.src}
                      alt={photoAlt(photo)}
                      fill
                      sizes="(max-width: 640px) 85vw, 260px"
                      placeholder={photo.blurDataURL ? "blur" : "empty"}
                      blurDataURL={photo.blurDataURL}
                      className="object-cover"
                    />
                  </div>
                </Link>
                <figcaption className="photo-label">
                  {printLabel(photo)}
                </figcaption>
              </figure>
            );
          })}
        </div>
      </div>
      <p className="mt-10 text-sm">
        <Link href="/photos" className={`${entryLink} text-muted`}>
          all photos →
        </Link>
      </p>
    </section>
  );
}

export default async function HomePage() {
  const photos = (await getPhotostream()).slice(0, 3);

  return (
    <>
      <h1 className="sr-only">Benedict Neo</h1>
      <article className="prose mb-10 text-base leading-relaxed">
        <p>welcome to my corner on the internet.</p>
        <p>
          i&apos;m benedict, born and <Link href="/about">raised</Link> in Kuala
          Lumpur, Malaysia.
        </p>
        <p>
          see what i&apos;m up to <Link href="/now">now</Link>.
        </p>
        <p>here are some places you can visit:</p>
        <ul>
          <li>
            <Link href="/map">list of places</Link>
          </li>
          <li>
            <Link href="/library">my library</Link>
          </li>
          <li>
            <Link href="/recipes">recipes</Link>
          </li>
          <li>
            <Link href="/uses">products i use</Link>
          </li>
        </ul>
      </article>

      <RecentWritings />
      <Gallery
        id="sketches"
        title="sketches"
        tiles={FEATURED_SKETCHES.map((sketch) => ({
          key: sketch.file,
          href: "/sketch",
          src: sketch.src,
          alt: sketch.label,
          ink: true,
        }))}
        more={{ href: "/sketch", label: "all sketches" }}
      />
      {photos.length > 0 && <Prints photos={photos} />}
      <QuoteFooter quotes={getQuotes()} />
    </>
  );
}
