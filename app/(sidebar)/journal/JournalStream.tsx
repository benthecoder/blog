import Link from "next/link";
import { Fragment } from "react";
import type { Metadata } from "next";
import MarkdownContent from "@/components/posts/MarkdownContent";
import { getPostsByFormat, getPostContent } from "@/utils/content/posts";
import { pageMetadata } from "@/utils/pageMetadata";

const JOURNAL_PER_PAGE = 10;

export function journalPageCount() {
  return Math.ceil(getPostsByFormat("journal").length / JOURNAL_PER_PAGE);
}

const pageHref = (page: number) =>
  page === 1 ? "/journal" : `/journal/${page}`;

// Every entry already has its own page, so the stream stays out of search
// results to avoid duplicating them.
export function journalMetadata(page: number): Metadata {
  return {
    ...pageMetadata({ title: "journal", path: pageHref(page) }),
    robots: { index: false, follow: true },
  };
}

const navLink =
  "text-accent hover:underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent";

// Journal entries (the date-named posts) read in full, newest first, a page
// at a time.
export function JournalStream({ page }: { page: number }) {
  const posts = getPostsByFormat("journal").slice(
    (page - 1) * JOURNAL_PER_PAGE,
    page * JOURNAL_PER_PAGE
  );
  const pages = journalPageCount();

  return (
    <>
      <h1 className="sr-only">journal</h1>
      <div>
        {posts.map((post, index) => (
          <Fragment key={post.slug}>
            {index > 0 && (
              <div
                role="separator"
                aria-label="Next journal entry"
                className="my-24 text-center text-2xl tracking-[0.6em] text-accent/60"
              >
                <span aria-hidden="true">•••</span>
              </div>
            )}
            <article>
              <header className="mb-8">
                <time dateTime={post.date} className="text-sm text-muted">
                  {new Date(post.date).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    timeZone: "UTC",
                  })}
                </time>
                <h2 className="mt-2 text-2xl font-bold">
                  <Link href={`/posts/${post.slug}`} className={navLink}>
                    {post.title}
                  </Link>
                </h2>
              </header>
              <div className="prose">
                <MarkdownContent
                  content={getPostContent(post.slug).content}
                  prioritizeFirstImage={false}
                  headingPrefix={`journal-${post.slug}-`}
                />
              </div>
            </article>
          </Fragment>
        ))}
      </div>
      <nav
        aria-label="Journal pages"
        className="mt-16 flex justify-between text-sm"
      >
        {page > 1 ? (
          <Link href={pageHref(page - 1)} className={navLink}>
            ← newer
          </Link>
        ) : (
          <span />
        )}
        <span className="text-muted">
          {page} / {pages}
        </span>
        {page < pages ? (
          <Link href={pageHref(page + 1)} className={navLink}>
            older →
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </>
  );
}
