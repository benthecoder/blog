import Link from "next/link";
import type { ReactNode } from "react";

export type SectionLink = { href: string; label: string };

const moreLink =
  "text-accent hover:underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent text-muted";

/**
 * One frame for every block on a page: a heading, an optional one-line note,
 * the content, then a way to see all of it. It keeps the homepage's spacing:
 * 16px from heading to content and 24px from content to the link. Pages put
 * 48px between sections with `space-y-12`.
 *
 * The heading is 20px bold. That is one step above 16px body text and one
 * below the 24px page title, so a section reads as a section without a rule
 * or a box around it.
 */
export function Section({
  id,
  title,
  note,
  more = [],
  children,
}: {
  id: string;
  title: string;
  note?: ReactNode;
  more?: SectionLink[];
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="m-0 text-xl font-bold text-primary">
        {title}
      </h2>
      {note ? <p className="mt-1 mb-0 text-sm text-muted">{note}</p> : null}
      <div className="mt-4">{children}</div>
      {more.length > 0 ? (
        <p className="mt-6 mb-0 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {more.map(({ href, label }) => (
            <Link key={href} href={href} className={moreLink}>
              {label} →
            </Link>
          ))}
        </p>
      ) : null}
    </section>
  );
}
