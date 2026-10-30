import Image from "next/image";
import Link from "next/link";
import HomeConnections from "@/components/ui/HomeConnections";
import { QuoteFooter } from "@/components/layout/QuoteFooter";
import { getQuotes } from "@/utils/content/quotes";
import { SKETCHES } from "@/config/sketches";
import { getPostMetadata } from "@/utils/content/posts";
import { FAVORITE } from "@/utils/content/tags";
import { getPhotostream } from "@/utils/content/photostream";
import { photoAlt } from "@/utils/photoCaption";

// Photos are live; refresh hourly so new uploads reach the homepage.
export const revalidate = 3600;

const FEATURED_SKETCHES = ["howl.png", "wave.png", "peony.png"].flatMap(
  (file) => SKETCHES.filter((sketch) => sketch.file === file)
);
const entryLink =
  "text-accent hover:underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent";

type PostLink = { slug: string; title: string; date: string };

function PostSection({
  id,
  title,
  posts,
  more,
}: {
  id: string;
  title: string;
  posts: PostLink[];
  more: { href: string; label: string };
}) {
  if (posts.length === 0) return null;
  return (
    <section aria-labelledby={id} className="mt-10 first-of-type:mt-0">
      <h2 id={id} className="mb-4 text-base font-bold text-primary">
        {title}
      </h2>
      <ul className="space-y-4">
        {posts.map((post) => (
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
      <p className="mt-6 text-sm">
        <Link href={more.href} className={`${entryLink} text-muted`}>
          {more.label} →
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

export default async function HomePage() {
  const posts = getPostMetadata();
  const photos = (await getPhotostream()).slice(0, 3);
  const favorites = posts
    .filter((post) => post.tags.includes(FAVORITE))
    .slice(0, 4);
  const recent = posts.slice(0, 3);

  return (
    <>
      <h1 className="sr-only">Benedict Neo</h1>
      <article className="prose text-base leading-relaxed">
        <p>welcome to my corner on the internet.</p>
        <p>
          i&apos;m benedict, <Link href="/about">born</Link> in{" "}
          <a href="https://en.wikipedia.org/wiki/Kuala_Lumpur">
            Kuala Lumpur, Malaysia
          </a>
          .
        </p>
        <p>
          see what i&apos;m up to <Link href="/now">now</Link>.
        </p>
        <p>here are some places you can visit:</p>
        <ul>
          <li>
            <Link href="/map">places i recommend</Link>
          </li>
          <li>
            <Link href="/library">the bookshelf</Link>
          </li>
        </ul>
      </article>

      <div className="my-8 text-center text-accent" aria-hidden="true">
        * * *
      </div>

      <PostSection
        id="favorites"
        title="recent favorites"
        posts={favorites}
        more={{ href: "/posts?view=favorites", label: "all favorites" }}
      />
      <PostSection
        id="daily-notes"
        title="recent daily notes"
        posts={recent}
        more={{ href: "/posts", label: "more in the archive" }}
      />
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
      {photos.length > 0 && (
        <Gallery
          id="photos"
          title="photos"
          tiles={photos.map((photo) => ({
            key: photo.id,
            href: `/photos/photo/${photo.id}`,
            src: photo.src,
            alt: photoAlt(photo),
          }))}
          more={{ href: "/photos", label: "all photos" }}
        />
      )}
      <HomeConnections />
      <QuoteFooter quotes={getQuotes()} />
    </>
  );
}
