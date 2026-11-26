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
import { SKETCHES } from "@/config/sketches";
import { loadThoughts } from "@/utils/loadThoughts";
import ThoughtBody from "@/components/thoughts/ThoughtBody";
import { thoughtTimeFormatter } from "@/utils/thoughtShare";
import type { ThoughtView } from "@/utils/thoughts";

// Photos are live; refresh hourly so a removed pick drops out.
export const revalidate = 3600;

/** Benedict's picks, left to right, each with the name for its print. A
    missing name falls back to the photo's caption or place. */
const FEATURED_PHOTOS: { id: string; label?: string }[] = [
  { id: "56982e040dbabb6b4a9d", label: "Transamerica" },
  { id: "052e2aa1829fba771e9f" },
  { id: "db5bda77f58c0df3bbd2", label: "Hyatt Regency" },
];

export const metadata: Metadata = { alternates: { canonical: "/" } };

const entryLink =
  "text-accent hover:underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent";

function RecentWritings() {
  const posts = getPostMetadata();
  return (
    <section aria-labelledby="writings" className="mt-12">
      <h2 id="writings" className="mb-4 text-lg font-bold text-primary">
        recent writings
      </h2>
      <ul className="space-y-2">
        {posts.slice(0, 5).map((post) => (
          <li key={post.slug} className="flex items-baseline gap-x-4">
            {/* Recent entries share a year, so the column carries month and day only. */}
            <span className="w-14 shrink-0 text-sm text-muted tabular-nums">
              {post.date.replace(/,\s*\d{4}$/, "")}
            </span>
            <h3 className="text-base">
              <Link href={`/posts/${post.slug}`} className={entryLink}>
                {post.title}
              </Link>
            </h3>
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

/** Written on the print's strip: its picked name, else its caption, else where it was taken. */
function printLabel(photo: StreamPhoto, label?: string) {
  if (label) return label;
  const place = parsePlace(photo.place);
  return (
    photoTitle(photo) ??
    (place && (place.city ?? place.country)) ??
    formatPhotoDate(photo.date)
  );
}

type FeaturedPhoto = { photo: StreamPhoto; label?: string };

/** The featured photos as a fanned row of instant prints, as in posts. */
function Prints({ photos }: { photos: FeaturedPhoto[] }) {
  return (
    <section aria-labelledby="photos" className="mt-12">
      <h2 id="photos" className="mb-4 text-lg font-bold text-primary">
        photos
      </h2>
      {/* Held to the column. The wrapper trues the visible gaps to the
          writings list: the fan's outer prints tilt about 16px below the
          row, and on a phone the swipe strip pads 8px above and 16px below
          for the shadows. */}
      <div className="pb-4 max-sm:-mt-2 max-sm:-mb-4 max-sm:pb-0">
        <div className="photo-group" style={{ margin: 0 }}>
          <div className="photo-row" data-n={photos.length}>
            {photos.map(({ photo, label }) => {
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
                        alt={label ?? photoAlt(photo)}
                        fill
                        sizes="(max-width: 640px) 85vw, 260px"
                        placeholder={photo.blurDataURL ? "blur" : "empty"}
                        blurDataURL={photo.blurDataURL}
                        className="object-cover"
                      />
                    </div>
                  </a>
                  <figcaption className="photo-label">
                    {printLabel(photo, label)}
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

async function latestThoughts(): Promise<ThoughtView[]> {
  try {
    return await loadThoughts({ limit: 3 });
  } catch {
    return [];
  }
}

function RecentThoughts({ thoughts }: { thoughts: ThoughtView[] }) {
  if (thoughts.length === 0) return null;
  return (
    <section aria-labelledby="thoughts" className="mt-12">
      <h2 id="thoughts" className="mb-4 text-lg font-bold text-primary">
        recent thoughts
      </h2>
      <ul className="space-y-5">
        {thoughts.map((entry) => (
          <li key={entry.id} className="flex gap-4 items-baseline">
            <Link
              href={`/thoughts/${entry.id}`}
              className="text-xs text-muted shrink-0 w-10 hover:text-accent"
              title="permalink"
            >
              {thoughtTimeFormatter.format(new Date(entry.created_at))}
            </Link>
            <ThoughtBody
              content={entry.content}
              link={entry.link}
              titles={entry.titles ?? {}}
            />
          </li>
        ))}
      </ul>
      <p className="mt-6 text-sm">
        <Link href="/thoughts" className={`${entryLink} text-muted`}>
          all thoughts →
        </Link>
      </p>
    </section>
  );
}

function FeaturedSketch() {
  const sketch = SKETCHES[0];
  if (!sketch) return null;
  return (
    <section aria-labelledby="sketch" className="mt-12">
      <h2 id="sketch" className="mb-4 text-lg font-bold text-primary">
        a sketch
      </h2>
      <Link
        href="/sketch"
        className="block w-fit focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
      >
        <Image
          src={sketch.src}
          alt={sketch.label}
          width={sketch.width}
          height={sketch.height}
          sizes="(max-width: 640px) 90vw, 400px"
          className="h-auto w-full max-w-sm"
        />
      </Link>
      <p className="mt-6 text-sm">
        <Link href="/sketch" className={`${entryLink} text-muted`}>
          all sketches →
        </Link>
      </p>
    </section>
  );
}

export default async function HomePage() {
  const stream = await getPhotostream();
  const photos = FEATURED_PHOTOS.flatMap(({ id, label }) => {
    const photo = stream.find((p) => p.id === id);
    return photo ? [{ photo, label }] : [];
  });
  const thoughts = await latestThoughts();
  return (
    <>
      <h1 className="sr-only">Benedict Neo</h1>
      <article className="prose text-base leading-relaxed">
        <p className="rounded-sm border border-dashed border-line px-3 py-2 text-sm text-muted not-prose">
          Opening line — add a sentence here if you want one. This box is a
          placeholder, not published as yours.
        </p>
        <p>
          i&apos;m benedict, born and <Link href="/about">raised</Link> in Kuala
          Lumpur, Malaysia.
        </p>
        <p>
          see what i&apos;m up to <Link href="/now">now</Link>, or{" "}
          <Link href="/contact#message">send me a message</Link>.
        </p>
        <p>
          <a href={MAPS_URL}>places</a>
          <span aria-hidden> · </span>
          <Link href="/sketch">sketches</Link>
        </p>
      </article>

      <RecentThoughts thoughts={thoughts} />
      <RecentWritings />
      <FeaturedSketch />
      {photos.length > 0 && <Prints photos={photos} />}
      <QuoteFooter quotes={getQuotes()} />
    </>
  );
}
