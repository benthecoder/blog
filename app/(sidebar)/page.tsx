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
import { MAPS_URL, PHOTOS_URL } from "@/config/site";

// Photos are live; refresh hourly so new uploads reach the homepage.
export const revalidate = 3600;

export const metadata: Metadata = { alternates: { canonical: "/" } };

const FEATURED_SKETCHES = ["howl.png", "wave.png", "peony.png"].flatMap(
  (file) => SKETCHES.filter((sketch) => sketch.file === file)
);
const entryLink =
  "text-accent hover:underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent";

type More = { href: string; label: string };

/** Every sample on the homepage shares this frame, so the page reads as one
    pattern repeated: a heading, a few of the things, and a way to see all. */
function Section({
  id,
  title,
  more,
  children,
}: {
  id: string;
  title: string;
  more: More[];
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="mb-4 text-base font-bold text-primary">
        {title}
      </h2>
      {children}
      <p className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        {more.map(({ href, label }) => (
          <Link key={href} href={href} className={`${entryLink} text-muted`}>
            {label} →
          </Link>
        ))}
      </p>
    </section>
  );
}

function RecentWritings() {
  const posts = getPostMetadata();
  return (
    <Section
      id="writings"
      title="recent writings"
      more={[
        { href: "/posts", label: "all writings" },
        { href: "/connections", label: "connections" },
      ]}
    >
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
    </Section>
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
  more: More;
}) {
  return (
    <Section id={id} title={title} more={[more]}>
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
    </Section>
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
    <Section
      id="photos"
      title="photos"
      more={[{ href: PHOTOS_URL, label: "all photos" }]}
    >
      {/* Held to the column: in a post a row of prints spreads into the
          margins, but here it sits beside the sketches at their width.
          The wrapper trues the visible gaps to the other sections: the fan's
          outer prints tilt about 16px below the row, and on a phone the
          swipe strip pads 8px above and 16px below for the shadows. */}
      <div className="pb-4 max-sm:-mt-2 max-sm:-mb-4 max-sm:pb-0">
        <div className="photo-group" style={{ margin: 0 }}>
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
                  <a
                    href={`${PHOTOS_URL}/photo/${photo.id}`}
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
                  </a>
                  <figcaption className="photo-label">
                    {printLabel(photo)}
                  </figcaption>
                </figure>
              );
            })}
          </div>
        </div>
      </div>
    </Section>
  );
}

export default async function HomePage() {
  const photos = (await getPhotostream()).slice(0, 3);

  return (
    <>
      <h1 className="sr-only">Benedict Neo</h1>
      <article className="prose text-base leading-relaxed">
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
            <a href={MAPS_URL}>list of places</a>
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

      <div className="mt-12 space-y-12">
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
      </div>
      <QuoteFooter quotes={getQuotes()} />
    </>
  );
}
