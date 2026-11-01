"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { draftQueue } from "@/utils/adminDraftQueue";
import { PostMetadata } from "@/types/post";

interface CalendarViewProps {
  posts: PostMetadata[];
}

export default function CalendarView({ posts }: CalendarViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentDate, setCurrentDate] = useState(() => {
    const monthParam = searchParams.get("month");
    if (monthParam) {
      const [year, month] = monthParam.split("-").map(Number);
      return new Date(year, month - 1);
    }
    return new Date();
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    const monthParam = `${year}-${String(month + 1).padStart(2, "0")}`;
    const currentMonthParam = searchParams.get("month");

    if (currentMonthParam !== monthParam) {
      const url = new URL(window.location.href);
      url.searchParams.set("month", monthParam);
      router.push(url.pathname + url.search, { scroll: false });
    }
  }, [year, month, router, searchParams]);

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  const postsByDate = new Map<string, PostMetadata>();
  posts.forEach((post) => {
    const slug = post.slug;
    if (/^\d{6}$/.test(slug)) {
      const day = slug.substring(0, 2);
      const mon = slug.substring(2, 4);
      const yr = slug.substring(4, 6);
      const dateKey = `20${yr}-${mon}-${day}`;
      const existing = postsByDate.get(dateKey);
      if (!existing || post.isDraft || !existing.isDraft)
        postsByDate.set(dateKey, post);
    }
  });

  const drafts = draftQueue(posts);
  const datedPosts = [...postsByDate.entries()]
    .filter(([key]) =>
      key.startsWith(`${year}-${String(month + 1).padStart(2, "0")}-`)
    )
    .map(([, post]) => post);
  const monthDrafts = datedPosts.filter((post) => post.isDraft);
  const monthPublished = datedPosts.length - monthDrafts.length;
  const oldest = drafts[0];

  const handleDateClick = (day: number) => {
    const dd = String(day).padStart(2, "0");
    const mm = String(month + 1).padStart(2, "0");
    const dateKey = `${year}-${mm}-${dd}`;
    const monthParam = `${year}-${mm}`;

    const existingPost = postsByDate.get(dateKey);
    if (existingPost) {
      router.push(`/admin/edit/${existingPost.slug}?month=${monthParam}`);
    } else {
      router.push(`/admin/edit/new?date=${dateKey}&month=${monthParam}`);
    }
  };

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1));
  };

  const today = new Date();
  const isToday = (day: number) => {
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const calendarDays = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  return (
    <div className="max-w-5xl mx-auto">
      <section
        aria-label="Writing progress"
        className="mb-8 border-b border-line pb-5 flex flex-wrap items-center justify-between gap-4"
      >
        <div>
          <p className="text-xl text-accent tabular-nums">
            {drafts.length} drafts left
          </p>
          <p className="mt-1 text-xs text-ink-soft dark:text-chalk-muted">
            {monthDrafts.length} this month · {monthPublished} published
          </p>
        </div>
        {oldest && (
          <Link
            href={`/admin/edit/${encodeURIComponent(oldest.slug)}`}
            className="min-h-11 inline-flex items-center text-sm text-accent underline underline-offset-4"
          >
            continue oldest draft →
          </Link>
        )}
        {datedPosts.length > 0 && (
          <div className="w-full">
            <progress
              aria-label="Published entries this month"
              max={datedPosts.length}
              value={monthPublished}
              className="block h-1.5 w-full accent-accent"
            />
            <p className="mt-2 text-xs text-ink-soft dark:text-chalk-muted">
              {monthPublished} of {datedPosts.length} entries published this
              month
            </p>
          </div>
        )}
      </section>
      <div className="mb-8 flex flex-wrap gap-4 items-center justify-between">
        <h2 className="text-3xl font-light tracking-wide text-accent">
          {monthNames[month]} {year}
        </h2>
        <div className="flex gap-3">
          <button
            aria-label="Previous month"
            onClick={prevMonth}
            className="px-4 py-2 border border-line rounded-xs hover:bg-paper dark:hover:bg-night-raised transition-colors text-accent"
          >
            ←
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-4 py-2 border border-line rounded-xs hover:bg-paper dark:hover:bg-night-raised transition-colors text-accent"
          >
            今日
          </button>
          <button
            aria-label="Next month"
            onClick={nextMonth}
            className="px-4 py-2 border border-line rounded-xs hover:bg-paper dark:hover:bg-night-raised transition-colors text-accent"
          >
            →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-3">
        {dayNames.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-light tracking-wider text-ink-soft dark:text-chalk-muted pb-3 uppercase"
          >
            {day}
          </div>
        ))}

        {calendarDays.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const dd = String(day).padStart(2, "0");
          const mm = String(month + 1).padStart(2, "0");
          const dateKey = `${year}-${mm}-${dd}`;
          const post = postsByDate.get(dateKey);
          const isTodayDate = isToday(day);
          const isDraft = post?.isDraft || false;

          return (
            <button
              key={day}
              onClick={() => handleDateClick(day)}
              className={`
                min-h-20 sm:aspect-square border rounded-xs p-1 sm:p-3 flex flex-col items-start justify-between relative
                hover:border-accent hover:shadow-xs transition-[border-color,box-shadow]
                ${isTodayDate ? "border-accent bg-chalk-soft dark:bg-night-raised shadow-xs" : "border-line"}
                ${isDraft ? "border-dashed border-accent bg-accent/5" : ""}
                ${post && !isTodayDate && !isDraft ? "bg-paper dark:bg-night-raised/50" : ""}
                ${!post && !isTodayDate ? "bg-paper-raised dark:bg-night" : ""}
              `}
            >
              <div className="flex items-start justify-between w-full">
                <span
                  className={`text-sm font-light ${
                    isTodayDate
                      ? "text-accent font-medium"
                      : post
                        ? "text-accent"
                        : "text-ink-soft dark:text-chalk-muted"
                  }`}
                >
                  {day}
                </span>
                {isDraft && (
                  <span className="text-accent text-2xs font-medium uppercase tracking-wide">
                    draft
                  </span>
                )}
                {!post && (
                  <span className="text-ink-soft dark:text-chalk-muted text-xs opacity-60">
                    +
                  </span>
                )}
              </div>

              {post && (
                <div className="text-left w-full">
                  <p className="text-xs text-accent font-light">{post.title}</p>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
