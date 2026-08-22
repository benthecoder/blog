"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

const navCls =
  "flex items-center gap-2 text-xs text-ink-soft dark:text-chalk-muted hover:text-ink dark:hover:text-chalk transition-colors";

export function EditorFooter({
  isNew,
  date,
  prevSlug,
  nextSlug,
  prevDate,
  nextDate,
  monthParam,
}: {
  isNew: boolean;
  date: string;
  prevSlug: string | null;
  nextSlug: string | null;
  prevDate: string | null;
  nextDate: string | null;
  monthParam: string | null;
}) {
  const monthQuery = (sep: "?" | "&") =>
    monthParam ? `${sep}month=${monthParam}` : "";

  const prevHref = isNew
    ? prevDate && `/admin/edit/new?date=${prevDate}${monthQuery("&")}`
    : prevSlug && `/admin/edit/${prevSlug}${monthQuery("?")}`;
  const nextHref = isNew
    ? nextDate && `/admin/edit/new?date=${nextDate}${monthQuery("&")}`
    : nextSlug && `/admin/edit/${nextSlug}${monthQuery("?")}`;

  return (
    <div className="absolute bottom-0 left-0 right-0 border-t border-rule dark:border-night-rule bg-paper dark:bg-night px-6 py-2 flex justify-between items-center">
      {prevHref ? (
        <Link href={prevHref} className={navCls}>
          <ChevronLeft size={14} />
          <span className="opacity-0 group-hover:opacity-100 transition-opacity">
            Previous
          </span>
        </Link>
      ) : (
        <div />
      )}

      {date && (
        <span className="text-xs text-ink-soft dark:text-chalk-muted tracking-wide">
          {date}
        </span>
      )}

      {nextHref ? (
        <Link href={nextHref} className={navCls}>
          <span className="opacity-0 group-hover:opacity-100 transition-opacity">
            Next
          </span>
          <ChevronRight size={14} />
        </Link>
      ) : (
        <div />
      )}
    </div>
  );
}
