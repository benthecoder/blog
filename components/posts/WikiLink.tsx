import Link from "next/link";
import type { ReactNode } from "react";
import { getLinkIndex } from "@/utils/content/links";

/**
 * Renders a `[[wikilink]]` after resolution. A resolved target becomes an
 * internal link; an unresolved one just renders as plain text (no styling) —
 * a link to a page that doesn't exist reads like ordinary prose.
 *
 * Server component — resolution reads the cached link index at render time.
 */
export default function WikiLink({
  target,
  children,
}: {
  target: string;
  children: ReactNode;
}) {
  const entry = getLinkIndex().resolve(target);

  if (!entry) return <>{children}</>;

  return (
    <Link
      href={entry.href}
      className="text-ink dark:text-chalk-soft no-underline hover:underline underline-offset-2"
    >
      {children}
    </Link>
  );
}
