"use client";

import { useState, Fragment } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
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
  const linkCls =
    "text-sm text-japanese-nezumiiro dark:text-japanese-ginnezu hover:text-japanese-sumiiro dark:hover:text-japanese-shironezu transition-colors";
  const disabledCls =
    "text-sm text-japanese-nezumiiro/30 dark:text-japanese-ginnezu/30";

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
      <h1 className="text-sm text-japanese-sumiiro dark:text-japanese-shironezu">
        {year}
      </h1>
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
  onClick,
}: {
  day: DayData;
  isToday: boolean;
  onHover: (day: DayData) => void;
  onLeave: () => void;
  onClick: (day: DayData) => void;
}) {
  return (
    <div
      className={`w-[9px] h-[9px] lg:w-[12px] lg:h-[12px] rounded-xs ${wordCountColor(day.posts)} ${
        day.posts.length > 0
          ? "cursor-pointer hover:ring-1 hover:ring-japanese-sumiiro dark:hover:ring-japanese-shironezu"
          : ""
      } ${isToday ? "shadow-[inset_0_0_0_1.5px_rgba(0,0,0,0.6)] dark:shadow-[inset_0_0_0_1.5px_rgba(255,255,255,0.6)]" : ""} transition-[box-shadow] duration-150`}
      onMouseEnter={() => day.posts.length > 0 && onHover(day)}
      onMouseLeave={onLeave}
      onClick={() => onClick(day)}
      title={day.date.toDateString()}
    />
  );
}

function HoverInfo({ day }: { day: DayData }) {
  return (
    <div className="text-xs">
      <span className="text-japanese-nezumiiro dark:text-japanese-ginnezu">
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
            className="text-japanese-sumiiro dark:text-japanese-shironezu hover:underline"
          >
            {post.title}
          </Link>
        </span>
      ))}
      <span className="text-japanese-nezumiiro dark:text-japanese-ginnezu">
        {" "}
        · {totalWordCount(day.posts)} words
      </span>
    </div>
  );
}

function Legend() {
  const cell = "w-[9px] h-[9px] lg:w-[12px] lg:h-[12px] rounded-xs";
  return (
    <div className="flex items-center justify-between text-xs">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <span className="text-japanese-nezumiiro dark:text-japanese-ginnezu text-[9px] md:text-[10px]">
            short
          </span>
          <div
            className={`${cell} bg-japanese-sumiiro/30 dark:bg-japanese-shironezu/30`}
          />
          <div
            className={`${cell} bg-japanese-sumiiro/60 dark:bg-japanese-shironezu/60`}
          />
          <div
            className={`${cell} bg-japanese-sumiiro/90 dark:bg-japanese-shironezu/90`}
          />
          <span className="text-japanese-nezumiiro dark:text-japanese-ginnezu text-[9px] md:text-[10px]">
            long
          </span>
        </div>
      </div>
    </div>
  );
}

const Heatmap = ({
  posts,
  year: initialYear,
  showNavigation = true,
  navigationPath = "/calendar",
}: HeatmapProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [hoveredDay, setHoveredDay] = useState<DayData | null>(null);

  // Read year from URL params, fallback to initialYear prop
  const yearParam = searchParams.get("year");
  const year = yearParam ? parseInt(yearParam, 10) : initialYear;

  const postYears = posts.map((post) => new Date(post.date).getFullYear());
  const minYear = Math.min(...postYears);
  // Use maxYear or current year, whichever is greater (for future posts)
  const maxYear = Math.max(...postYears, new Date().getFullYear());

  const weeks = buildWeeks(year, groupPostsByDate(posts));
  const monthLabels = getMonthLabels(weeks, year);
  const todayKey = dateKey(new Date());

  const handleDayClick = (day: DayData) => {
    if (day.posts.length === 1) {
      router.push(`/posts/${day.posts[0].slug}`);
    }
  };

  return (
    <div>
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
          className="grid gap-px md:gap-[0.5px] lg:gap-px [--hm-cell:9px] lg:[--hm-cell:12px]"
          style={{
            gridTemplateColumns: `15px repeat(${weeks.length}, var(--hm-cell))`,
          }}
        >
          {/* Row 0: Empty corner + month labels */}
          <div />
          {weeks.map((_, weekIndex) => (
            <div
              key={`month-${weekIndex}`}
              className="text-[8px] md:text-[10px] text-japanese-nezumiiro/60 dark:text-japanese-ginnezu/60 h-[12px] md:h-[14px] w-[9px] lg:w-[12px] overflow-visible"
            >
              {monthLabels.get(weekIndex) || ""}
            </div>
          ))}

          {/* Rows 1-7: Day labels + day cells */}
          {DAY_LABELS.map((label, dayOfWeek) => (
            <Fragment key={dayOfWeek}>
              <div className="text-[8px] md:text-[11px] text-japanese-nezumiiro/60 dark:text-japanese-ginnezu/60 flex items-center pr-0.5 md:pr-1 h-[9px] lg:h-[12px]">
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
                    onClick={handleDayClick}
                  />
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>

      {/* Info bar below - compact */}
      <div className="pt-2">
        {hoveredDay ? <HoverInfo day={hoveredDay} /> : <Legend />}
      </div>
    </div>
  );
};

export default Heatmap;
