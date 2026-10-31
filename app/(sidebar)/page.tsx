import Image from "next/image";
import Link from "next/link";
import HomeConnections from "@/components/ui/HomeConnections";
import { QuoteFooter } from "@/components/layout/QuoteFooter";
import { getQuotes } from "@/utils/content/quotes";
import { SKETCHES } from "@/config/sketches";
import { getPostsByFormat } from "@/utils/content/posts";
import { formatConfig } from "@/utils/content/formats";
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
  const photos = (await getPhotostream()).slice(0, 3);
  const writings = getPostsByFormat("essay").slice(0, 4);
  const recent = getPostsByFormat("journal").slice(0, 3);

  return (
    <>
      <h1 className="sr-only">Benedict Neo</h1>
      <figure className="mx-auto mb-10 w-4/5 max-w-md">
        <a
          href="https://en.wikipedia.org/wiki/The_Great_Wave_off_Kanagawa"
          className="block transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-4"
        >
          <Image
            src="/images/wave.jpeg"
            alt="The Great Wave off Kanagawa by Katsushika Hokusai, with boats beneath a breaking wave and Mount Fuji in the distance"
            width={2000}
            height={1368}
            sizes="(max-width: 640px) 80vw, 448px"
            className="h-auto w-full"
          />
        </a>
        <figcaption className="mt-2 text-xs text-muted">
          <span lang="ja">神奈川沖浪裏</span> · Katsushika Hokusai
        </figcaption>
      </figure>
      <article className="prose mb-10 text-base leading-relaxed">
        <p>welcome to my corner on the internet.</p>
        <p>
          i&apos;m benedict, <Link href="/about">born</Link> in Kuala Lumpur,
          Malaysia.
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
          <li>
            <Link href="/recipes">recipes</Link>
          </li>
        </ul>
      </article>

      <PostSection
        id="writings"
        title={formatConfig("essay").homeHeading}
        posts={writings}
        more={{ href: "/posts?view=essay", label: "all writings" }}
      />
      <PostSection
        id="journal"
        title={formatConfig("journal").homeHeading}
        posts={recent}
        more={{ href: "/journal", label: "read the journal" }}
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
