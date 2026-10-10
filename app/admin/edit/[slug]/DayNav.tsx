"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

const navCls =
  "fixed -translate-y-1/2 z-10 hidden lg:flex h-16 w-10 items-center justify-center rounded-xs text-ink-soft dark:text-chalk-muted opacity-30 hover:opacity-100 focus-visible:opacity-100 transition-opacity focus-visible:outline-2 focus-visible:outline-ink dark:focus-visible:outline-chalk";

const pad = (n: number) => String(n).padStart(2, "0");

/** First post in the month `offset` away from `date` (YYYY-MM-DD), else a new post on its 1st. */
function monthHref(date: string, offset: number, slugs: string[]) {
  const [year, month] = date.split("-").map(Number);
  const target = new Date(year, month - 1 + offset, 1);
  const mm = pad(target.getMonth() + 1);
  const yy = String(target.getFullYear()).slice(2);
  const first = slugs
    .filter((slug) => /^\d{6}$/.test(slug) && slug.slice(2) === `${mm}${yy}`)
    .sort()[0];
  const monthQuery = `month=${target.getFullYear()}-${mm}`;
  return first
    ? `/admin/edit/${first}?${monthQuery}`
    : `/admin/edit/new?date=${target.getFullYear()}-${mm}-01&${monthQuery}`;
}

/** Fixed chevrons at the viewport edges: single steps a day, double a month. */
export function DayNav({
  date,
  isNew,
  prevSlug,
  nextSlug,
  prevDate,
  nextDate,
  monthParam,
}: {
  /** YYYY-MM-DD of the open post, when known. */
  date: string | null;
  isNew: boolean;
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

  const [slugs, setSlugs] = useState<string[] | null>(null);
  useEffect(() => {
    if (!date) return;
    const controller = new AbortController();
    fetch("/api/admin/list-posts", { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : []))
      .then((list: string[]) => setSlugs(list))
      .catch(() => {});
    return () => controller.abort();
  }, [date]);

  const prevMonthHref = date && slugs ? monthHref(date, -1, slugs) : null;
  const nextMonthHref = date && slugs ? monthHref(date, 1, slugs) : null;

  return (
    <>
      {prevMonthHref && (
        <Link
          href={prevMonthHref}
          aria-label="previous month"
          title="previous month (⌘⇧[)"
          className={`${navCls} top-[calc(50%+4rem)] left-3`}
        >
          <ChevronsLeft size={20} />
        </Link>
      )}
      {nextMonthHref && (
        <Link
          href={nextMonthHref}
          aria-label="next month"
          title="next month (⌘⇧])"
          className={`${navCls} top-[calc(50%+4rem)] right-3`}
        >
          <ChevronsRight size={20} />
        </Link>
      )}
      {prevHref && (
        <Link
          href={prevHref}
          aria-label="previous day"
          title="previous day (⌘[)"
          className={`${navCls} top-1/2 left-3`}
        >
          <ChevronLeft size={22} />
        </Link>
      )}
      {nextHref && (
        <Link
          href={nextHref}
          aria-label="next day"
          title="next day (⌘])"
          className={`${navCls} top-1/2 right-3`}
        >
          <ChevronRight size={22} />
        </Link>
      )}
    </>
  );
}
