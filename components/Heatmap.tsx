"use client";

import { useState } from "react";
import Link from "next/link";
import { PostMetadata } from "@/types/post";

interface HeatmapProps {
  posts: PostMetadata[];
  year: number;
  month: number;
  showNavigation?: boolean;
  navigationPath?: string;
}

interface DayData {
  date: Date;
  posts: PostMetadata[];
  dateKey: string;
}

const Heatmap = ({
  posts,
  year,
  showNavigation = true,
  navigationPath = "/calendar",
}: HeatmapProps) => {
  const [hoveredDay, setHoveredDay] = useState<DayData | null>(null);

  // Calculate min and max years from actual posts
  const postYears = posts.map((post) => new Date(post.date).getFullYear());
  const minYear = Math.min(...postYears);
  const maxYear = Math.max(...postYears);
  const currentYear = new Date().getFullYear();

  // Use maxYear or current year, whichever is greater (for future posts)
  const effectiveMaxYear = Math.max(maxYear, currentYear);

  // Group posts by date
  const postsByDate: { [key: string]: PostMetadata[] } = {};
  posts.forEach((post) => {
    const date = new Date(post.date);
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    if (!postsByDate[dateKey]) {
      postsByDate[dateKey] = [];
    }
    postsByDate[dateKey].push(post);
  });

  // Generate all days in the year, organized by weeks
  const firstDayOfYear = new Date(year, 0, 1);
  const lastDayOfYear = new Date(year, 11, 31);

  // Start from the Sunday before or on Jan 1
  const startDate = new Date(firstDayOfYear);
  startDate.setDate(startDate.getDate() - startDate.getDay());

  // End on the Saturday after or on Dec 31
  const endDate = new Date(lastDayOfYear);
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

  const weeks: DayData[][] = [];
  let currentWeek: DayData[] = [];
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dateKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`;
    // Only show posts for dates in the current calendar year
    const dayPosts =
      currentDate.getFullYear() === year ? postsByDate[dateKey] || [] : [];

    currentWeek.push({
      date: new Date(currentDate),
      posts: dayPosts,
      dateKey,
    });

    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Add remaining days if any
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  // Month labels - find first day of each month
  const monthLabels: { month: string; weekIndex: number }[] = [];
  const monthNames = [
    "jan",
    "feb",
    "mar",
    "apr",
    "may",
    "jun",
    "jul",
    "aug",
    "sep",
    "oct",
    "nov",
    "dec",
  ];

  weeks.forEach((week, weekIndex) => {
    week.forEach((day) => {
      if (day.date.getDate() === 1 && day.date.getFullYear() === year) {
        monthLabels.push({
          month: monthNames[day.date.getMonth()],
          weekIndex,
        });
      }
    });
  });

  // Get color based on total word count for the day
  const getColor = (posts: PostMetadata[]) => {
    const totalWords = posts.reduce(
      (sum, post) => sum + (post.wordcount || 0),
      0
    );
    if (totalWords === 0)
      return "bg-japanese-shiraumenezu/20 dark:bg-gray-800/20";
    if (totalWords <= 300)
      return "bg-japanese-sumiiro/30 dark:bg-japanese-shironezu/30";
    if (totalWords <= 800)
      return "bg-japanese-sumiiro/60 dark:bg-japanese-shironezu/60";
    return "bg-japanese-sumiiro/90 dark:bg-japanese-shironezu/90";
  };

  const handleDayClick = (day: DayData) => {
    if (day.posts.length === 1) {
      window.location.href = `/posts/${day.posts[0].slug}`;
    }
  };

  return (
    <div>
      {/* Header */}
      {showNavigation ? (
        <div className="flex items-center justify-between mb-4">
          {year > minYear ? (
            <Link
              href={`${navigationPath}?year=${year - 1}&month=0`}
              className="text-sm text-japanese-nezumiiro dark:text-japanese-ginnezu hover:text-japanese-sumiiro dark:hover:text-japanese-shironezu transition-colors"
            >
              ← {year - 1}
            </Link>
          ) : (
            <span className="text-sm text-japanese-nezumiiro/30 dark:text-japanese-ginnezu/30">
              ← {year - 1}
            </span>
          )}
          <h1 className="text-sm text-japanese-sumiiro dark:text-japanese-shironezu">
            {year}
          </h1>
          {year < effectiveMaxYear ? (
            <Link
              href={`${navigationPath}?year=${year + 1}&month=0`}
              className="text-sm text-japanese-nezumiiro dark:text-japanese-ginnezu hover:text-japanese-sumiiro dark:hover:text-japanese-shironezu transition-colors"
            >
              {year + 1} →
            </Link>
          ) : (
            <span className="text-sm text-japanese-nezumiiro/30 dark:text-japanese-ginnezu/30">
              {year + 1} →
            </span>
          )}
        </div>
      ) : null}

      <div className="flex gap-2 mb-2">
        {/* Day labels */}
        <div className="flex flex-col gap-[1px] md:gap-[2px] pt-[16px] text-[9px] md:text-[11px] text-japanese-nezumiiro/60 dark:text-japanese-ginnezu/60">
          <div className="h-[8px] md:h-[8px] lg:h-[11px] flex items-center">
            s
          </div>
          <div className="h-[8px] md:h-[8px] lg:h-[11px] flex items-center">
            m
          </div>
          <div className="h-[8px] md:h-[8px] lg:h-[11px] flex items-center">
            t
          </div>
          <div className="h-[8px] md:h-[8px] lg:h-[11px] flex items-center">
            w
          </div>
          <div className="h-[8px] md:h-[8px] lg:h-[11px] flex items-center">
            t
          </div>
          <div className="h-[8px] md:h-[8px] lg:h-[11px] flex items-center">
            f
          </div>
          <div className="h-[8px] md:h-[8px] lg:h-[11px] flex items-center">
            s
          </div>
        </div>

        {/* Calendar section */}
        <div className="flex-1 overflow-x-auto md:overflow-visible">
          {/* Month labels */}
          <div className="relative h-[14px] mb-1">
            {monthLabels.map((label) => (
              <div
                key={label.month}
                className="absolute text-[9px] md:text-[10px] text-japanese-nezumiiro/60 dark:text-japanese-ginnezu/60"
                style={{
                  left: `calc((100% / ${weeks.length}) * ${label.weekIndex})`,
                }}
              >
                {label.month}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div
            className="grid gap-[1px] md:gap-[2px] min-w-[467px] md:min-w-0"
            style={{ gridTemplateColumns: `repeat(${weeks.length}, 1fr)` }}
          >
            {weeks.map((week, weekIndex) => (
              <div
                key={weekIndex}
                className="flex flex-col gap-[1px] md:gap-[2px]"
              >
                {week.map((day, dayIndex) => {
                  const isToday =
                    day.date.getDate() === new Date().getDate() &&
                    day.date.getMonth() === new Date().getMonth() &&
                    day.date.getFullYear() === new Date().getFullYear();

                  return (
                    <div
                      key={dayIndex}
                      className={`w-full aspect-square rounded-[1px] ${getColor(day.posts)} ${
                        day.posts.length > 0
                          ? "cursor-pointer hover:ring-1 hover:ring-japanese-sumiiro dark:hover:ring-japanese-shironezu"
                          : ""
                      } ${isToday ? "ring-1 ring-japanese-sumiiro dark:ring-japanese-shironezu" : ""} transition-all`}
                      onMouseEnter={() =>
                        day.posts.length > 0 && setHoveredDay(day)
                      }
                      onMouseLeave={() => setHoveredDay(null)}
                      onClick={() => handleDayClick(day)}
                      title={day.date.toDateString()}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Info bar below - compact */}
      <div className="border-t border-japanese-shiraumenezu dark:border-gray-800 pt-2">
        {hoveredDay ? (
          <div className="text-xs">
            <span className="text-japanese-nezumiiro dark:text-japanese-ginnezu">
              {hoveredDay.date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}{" "}
              ·{" "}
            </span>
            {hoveredDay.posts.map((post, idx) => (
              <span key={idx}>
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
              ·{" "}
              {hoveredDay.posts.reduce(
                (sum, post) => sum + (post.wordcount || 0),
                0
              )}{" "}
              words
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="text-japanese-nezumiiro dark:text-japanese-ginnezu text-[10px]">
                  short
                </span>
                <div className="w-[10px] h-[10px] rounded-[1px] bg-japanese-sumiiro/30 dark:bg-japanese-shironezu/30"></div>
                <div className="w-[10px] h-[10px] rounded-[1px] bg-japanese-sumiiro/60 dark:bg-japanese-shironezu/60"></div>
                <div className="w-[10px] h-[10px] rounded-[1px] bg-japanese-sumiiro/90 dark:bg-japanese-shironezu/90"></div>
                <span className="text-japanese-nezumiiro dark:text-japanese-ginnezu text-[10px]">
                  long
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Heatmap;
