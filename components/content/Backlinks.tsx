import Link from "next/link";
import type { ContentRef } from "@/types/links";
import { getBacklinks } from "@/utils/content/links";

/**
 * "Linked from" — the pages that `[[link]]` to this one, derived from the link
 * graph. Renders nothing when there are no backlinks. (`contentRef`, not
 * `ref` — React reserves `ref` as a special prop.)
 */
export default function Backlinks({ contentRef }: { contentRef: ContentRef }) {
  const backlinks = getBacklinks(contentRef);
  if (backlinks.length === 0) return null;

  return (
    <section className="mt-12 pt-6 border-t border-rule dark:border-night-rule">
      <h2 className="text-[10px] font-mono tracking-widest uppercase text-ink-strong/40 dark:text-chalk-strong/40 mb-3">
        Linked from
      </h2>
      <ul className="space-y-1.5">
        {backlinks.map((entry) => (
          <li key={entry.href}>
            <Link
              href={entry.href}
              className="text-sm text-ink dark:text-chalk-soft hover:underline underline-offset-2"
            >
              {entry.title}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
