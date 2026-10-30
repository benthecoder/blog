import Link from "next/link";
import type { Metadata } from "next";
import MarkdownContent from "@/components/posts/MarkdownContent";
import { getJournalEntries, getPostContent } from "@/utils/content/posts";
import { pageMetadata } from "@/utils/pageMetadata";

const JOURNAL_PER_PAGE = 10;

export function journalPageCount() {
  return Math.ceil(getJournalEntries().length / JOURNAL_PER_PAGE);
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
  const posts = getJournalEntries().slice(
    (page - 1) * JOURNAL_PER_PAGE,
    page * JOURNAL_PER_PAGE
  );
  const pages = journalPageCount();

  return (
    <>
      <h1 className="sr-only">journal</h1>
      <div className="space-y-16">
        {posts.map((post) => (
          <article key={post.slug}>
            <p className="text-xs text-muted">{post.date}</p>
            <h2 className="mt-1 mb-4 text-base font-bold">
              <Link href={`/posts/${post.slug}`} className={navLink}>
                {post.title}
              </Link>
            </h2>
            <div className="prose">
              <MarkdownContent
                content={getPostContent(post.slug).content}
                prioritizeFirstImage={false}
              />
            </div>
          </article>
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
