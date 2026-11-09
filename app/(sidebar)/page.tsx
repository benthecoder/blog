import type { Metadata } from "next";
import Link from "next/link";
import { QuoteFooter } from "@/components/layout/QuoteFooter";
import { getQuotes } from "@/utils/content/quotes";
import { getPostMetadata } from "@/utils/content/posts";
import { MAPS_URL, PHOTOS_URL } from "@/config/site";

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

export default function HomePage() {
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
            <a href={PHOTOS_URL}>photos</a>
          </li>
          <li>
            <Link href="/sketch">sketches</Link>
          </li>
          <li>
            <Link href="/library">my library</Link>
          </li>
          <li>
            <Link href="/syllabus">my curriculum</Link>
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
      <QuoteFooter quotes={getQuotes()} />
    </>
  );
}
