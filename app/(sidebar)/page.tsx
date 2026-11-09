import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { QuoteFooter } from "@/components/layout/QuoteFooter";
import { getQuotes } from "@/utils/content/quotes";
import { getPostMetadata } from "@/utils/content/posts";
import { getPhotostream } from "@/utils/content/photostream";
import { photoAlt, photoTitle } from "@/utils/photoCaption";
import { parsePlace } from "@/utils/photoPlaces";
import { formatPhotoDate } from "@/utils/photoDate";
import { filmFor } from "@/utils/photoFilm";
import type { StreamPhoto } from "@/types/photostream";
import { MAPS_URL, PHOTOS_URL } from "@/config/site";

// Photos are live; refresh hourly so a removed pick drops out.
export const revalidate = 3600;

/** Hand-picked from the photostream, left to right: Forest Books, the F-line
    streetcars, a Chinatown roast-duck window. */
const FEATURED_PHOTOS = [
  "068a3aab4c2e3ea33243",
  "79ab3b5c74b433c6aee2",
  "59a00e718dd8ab74d508",
];

export const metadata: Metadata = { alternates: { canonical: "/" } };

const entryLink =
  "text-accent hover:underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent";

function RecentWritings() {
  const posts = getPostMetadata();
  return (
    <section aria-labelledby="writings" className="mt-12">
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
        <Link href="/connections" className={`${entryLink} text-muted`}>
          connections →
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

/** The featured photos as a fanned row of instant prints, as in posts. */
function Prints({ photos }: { photos: StreamPhoto[] }) {
  return (
    <section aria-labelledby="photos" className="mt-12">
      <h2 id="photos" className="mb-4 text-base font-bold text-primary">
        photos
      </h2>
      {/* Held to the column. The wrapper trues the visible gaps to the
          writings list: the fan's outer prints tilt about 16px below the
          row, and on a phone the swipe strip pads 8px above and 16px below
          for the shadows. */}
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
      <p className="mt-6 text-sm">
        <a href={PHOTOS_URL} className={`${entryLink} text-muted`}>
          all photos →
        </a>
      </p>
    </section>
  );
}

export default async function HomePage() {
  const stream = await getPhotostream();
  const photos = FEATURED_PHOTOS.flatMap(
    (id) => stream.find((photo) => photo.id === id) ?? []
  );
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
          see what i&apos;m up to <Link href="/now">now</Link>, or{" "}
          <Link href="/contact#message">send me a message</Link>.
        </p>
        <p>some pages to explore:</p>
        <ul>
          <li>
            <a href={MAPS_URL}>list of places</a>
          </li>
          <li>
            <Link href="/sketch">sketches</Link>
          </li>
          <li>
            <Link href="/syllabus">my curriculum</Link>
          </li>
          <li>
            <Link href="/uses">products i use</Link>
          </li>
        </ul>
      </article>

      <RecentWritings />
      {photos.length > 0 && <Prints photos={photos} />}
      <QuoteFooter quotes={getQuotes()} />
    </>
  );
}
