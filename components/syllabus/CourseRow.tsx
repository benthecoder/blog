import Link from "next/link";
import type { ReactNode } from "react";

/**
 * One course as two lines: the plain name with its track on the right, then
 * one muted line of facts. The enrolled timetable adds a day column; up next
 * uses the same row without it.
 */
export default function CourseRow({
  href,
  title,
  track,
  meta,
  day,
}: {
  href: string;
  title: string;
  track?: string;
  meta?: ReactNode;
  day?: string;
}) {
  const withDay = Boolean(day);
  return (
    <Link
      href={href}
      className={`group grid ${
        withDay
          ? "grid-cols-[2.5rem_minmax(0,1fr)_auto]"
          : "grid-cols-[minmax(0,1fr)_auto]"
      } gap-x-3 text-primary no-underline focus-ring`}
    >
      {withDay ? (
        <span className="text-sm leading-6 text-muted tabular-nums">{day}</span>
      ) : null}
      <span className="min-w-0 text-base leading-6 group-hover:text-accent">
        {title}
      </span>
      <span className="text-sm leading-6 text-muted whitespace-nowrap">
        {track}
      </span>
      {meta ? (
        <span
          className={`${withDay ? "col-start-2" : ""} col-span-2 min-w-0 text-sm leading-5 text-muted`}
        >
          {meta}
        </span>
      ) : null}
    </Link>
  );
}
