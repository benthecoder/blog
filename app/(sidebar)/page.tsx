import Link from "next/link";
import HomeConnections from "@/components/ui/HomeConnections";
import ArtworkStrip from "@/components/ui/ArtworkStrip";
import { getPostMetadata } from "@/utils/content/posts";

export const dynamic = "force-static";

const SELECTED_SLUGS = ["311225", "060425", "281024", "values"];
const entryLink =
  "text-accent hover:underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent";

export default function HomePage() {
  const posts = getPostMetadata();
  const selected = SELECTED_SLUGS.flatMap((slug) => {
    const post = posts.find((entry) => entry.slug === slug);
    return post ? [post] : [];
  });
  const recent = posts.slice(0, 3);

  return (
    <>
      <h1 className="sr-only">Benedict Neo</h1>
      <ArtworkStrip />
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
            <Link href="/photos">photos</Link>
          </li>
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

      {selected.length > 0 && (
        <section aria-labelledby="selected-writing">
          <h2
            id="selected-writing"
            className="mb-4 text-base font-bold text-primary"
          >
            selected writing
          </h2>
          <ul className="space-y-4">
            {selected.map((post) => (
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
        </section>
      )}

      {recent.length > 0 && (
        <section aria-labelledby="recent-writing" className="mt-10">
          <h2
            id="recent-writing"
            className="mb-4 text-base font-bold text-primary"
          >
            recent writing
          </h2>
          <ul className="space-y-4">
            {recent.map((post) => (
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
            <Link href="/posts" className={`${entryLink} text-muted`}>
              more in the archive →
            </Link>
          </p>
        </section>
      )}
      <HomeConnections />
    </>
  );
}
