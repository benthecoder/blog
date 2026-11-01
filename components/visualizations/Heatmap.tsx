"use client";

import { useState, Fragment, type CSSProperties } from "react";
import Link from "next/link";
import { hoverTick } from "@/utils/hoverTick";
import { PostMetadata } from "@/types/post";
import {
  DayData,
  buildWeeks,
  dateKey,
  getMonthLabels,
  groupPostsByDate,
  totalWordCount,
  wordCountColor,
} from "@/utils/content/heatmap";

interface HeatmapProps {
  posts: PostMetadata[];
  year: number;
  month: number;
  showNavigation?: boolean;
  navigationPath?: string;
}

const DAY_LABELS = ["s", "m", "t", "w", "t", "f", "s"];

function YearNav({
  year,
  minYear,
  maxYear,
  navigationPath,
}: {
  year: number;
  minYear: number;
  maxYear: number;
  navigationPath: string;
}) {
  const sep = navigationPath.includes("?") ? "&" : "?";
  const linkCls = "text-sm text-muted hover:text-accent transition-colors";
  const disabledCls = "text-sm text-muted/30";

  return (
    <div className="flex items-center justify-between mb-4">
      {year > minYear ? (
        <Link
          href={`${navigationPath}${sep}year=${year - 1}&month=0`}
          className={linkCls}
        >
          ← {year - 1}
        </Link>
      ) : (
        <span className={disabledCls}>← {year - 1}</span>
      )}
      <h1 className="text-sm text-accent">{year}</h1>
      {year < maxYear ? (
        <Link
          href={`${navigationPath}${sep}year=${year + 1}&month=0`}
          className={linkCls}
        >
          {year + 1} →
        </Link>
      ) : (
        <span className={disabledCls}>{year + 1} →</span>
      )}
    </div>
  );
}

function DayCell({
  day,
  isToday,
  onHover,
  onLeave,
}: {
  day: DayData;
  isToday: boolean;
  onHover: (day: DayData) => void;
  onLeave: () => void;
}) {
  const className = `w-(--hm-cell) h-(--hm-cell) rounded-xs ${wordCountColor(day.posts)} ${
    day.posts.length > 0 ? "cursor-pointer hover:ring-1 hover:ring-accent" : ""
  } ${isToday ? "shadow-[inset_0_0_0_1.5px_rgba(0,0,0,0.6)] dark:shadow-[inset_0_0_0_1.5px_rgba(255,255,255,0.6)]" : ""} transition-[box-shadow] duration-150`;
  const events = {
    onMouseEnter: () => {
      if (day.posts.length === 0) return;
      hoverTick();
      onHover(day);
    },
    onMouseLeave: onLeave,
  };
  const title = day.date.toDateString();
  if (day.posts.length === 1) {
    const post = day.posts[0];
    return (
      <Link
        href={`/posts/${post.slug}`}
        prefetch={false}
        className={`${className} block focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2`}
        title={title}
        aria-label={`${title}: ${post.title}`}
        onFocus={() => onHover(day)}
        onBlur={onLeave}
        {...events}
      />
    );
  }
  return <div className={className} title={title} {...events} />;
}

function HoverInfo({ day }: { day: DayData }) {
  return (
    <div className="truncate text-xs">
      <span className="text-muted">
        {day.date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })}{" "}
        ·{" "}
      </span>
      {day.posts.map((post, idx) => (
        <span key={post.slug}>
          {idx > 0 && ", "}
          <Link
            href={`/posts/${post.slug}`}
            className="text-accent hover:underline"
          >
            {post.title}
          </Link>
        </span>
      ))}
      <span className="text-muted"> · {totalWordCount(day.posts)} words</span>
    </div>
  );
}

function Legend() {
  const cell = "w-(--hm-cell) h-(--hm-cell) rounded-xs";
  return (
    <div className="flex items-center justify-between text-xs">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <span className="text-muted text-3xs md:text-2xs">short</span>
          <div className={`${cell} bg-accent/30`} />
          <div className={`${cell} bg-accent/60`} />
          <div className={`${cell} bg-accent/90`} />
          <span className="text-muted text-3xs md:text-2xs">long</span>
        </div>
      </div>
    </div>
  );
}

const Heatmap = ({
  posts,
  year,
  showNavigation = true,
  navigationPath = "/calendar",
}: HeatmapProps) => {
  const [hoveredDay, setHoveredDay] = useState<DayData | null>(null);

  const postYears = posts.map((post) => new Date(post.date).getFullYear());
  const minYear = Math.min(...postYears);
  // Use maxYear or current year, whichever is greater (for future posts)
  const maxYear = Math.max(...postYears, new Date().getFullYear());

  const weeks = buildWeeks(year, groupPostsByDate(posts));
  const monthLabels = getMonthLabels(weeks, year);
  const todayKey = dateKey(new Date());

  return (
    // The cell size is computed from the container width so the grid spans
    // exactly the content column on md+ (9px + horizontal scroll below md).
    // Everything (cells, labels, legend) reads the same --hm-cell variable.
    <div
      className="[container-type:inline-size] [--hm-cell:9px] md:[--hm-cell:calc((100cqw_-_15px_-_(var(--hm-n)_-_1)*1px)/var(--hm-n))]"
      style={{ "--hm-n": weeks.length } as CSSProperties}
    >
      {showNavigation && (
        <YearNav
          year={year}
          minYear={minYear}
          maxYear={maxYear}
          navigationPath={navigationPath}
        />
      )}

      <div className="overflow-x-auto md:overflow-visible [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div
          className="grid gap-px"
          style={{
            gridTemplateColumns: `15px repeat(${weeks.length}, var(--hm-cell))`,
          }}
        >
          {/* Row 0: Empty corner + month labels */}
          <div />
          {weeks.map((_, weekIndex) => (
            <div
              key={`month-${weekIndex}`}
              className="text-[8px] md:text-2xs text-muted/60 h-[12px] md:h-[14px] w-[9px] md:w-auto overflow-visible whitespace-nowrap"
            >
              {monthLabels.get(weekIndex) || ""}
            </div>
          ))}

          {/* Rows 1-7: Day labels + day cells */}
          {DAY_LABELS.map((label, dayOfWeek) => (
            <Fragment key={dayOfWeek}>
              <div className="text-[8px] md:text-2xs leading-none text-muted/60 flex items-center pr-0.5 md:pr-1 h-(--hm-cell)">
                {label}
              </div>
              {weeks.map((week, weekIndex) => {
                const day = week[dayOfWeek];
                return (
                  <DayCell
                    key={`${weekIndex}-${dayOfWeek}`}
                    day={day}
                    isToday={day.dateKey === todayKey}
                    onHover={setHoveredDay}
                    onLeave={() => setHoveredDay(null)}
                  />
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>

      {/* Info bar below: one fixed line, so hovering never shifts the page */}
      <div className="pt-2 h-6">
        {hoveredDay ? <HoverInfo day={hoveredDay} /> : <Legend />}
      </div>
    </div>
  );
};

export default Heatmap;
