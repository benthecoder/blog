"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { PostMetadata } from "@/types/post";

interface CalendarViewProps {
  posts: PostMetadata[];
}

export default function CalendarView({ posts }: CalendarViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize from URL params or default to current date
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

  // Update URL when currentDate changes
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
    if (slug.length === 6) {
      const day = slug.substring(0, 2);
      const mon = slug.substring(2, 4);
      const yr = slug.substring(4, 6);
      const dateKey = `20${yr}-${mon}-${day}`;
      postsByDate.set(dateKey, post);
    }
  });

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
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-3xl font-light tracking-wide text-japanese-sumiiro dark:text-japanese-shironezu">
          {monthNames[month]} {year}
        </h2>
        <div className="flex gap-3">
          <button
            onClick={prevMonth}
            className="px-4 py-2 border border-japanese-shiraumenezu dark:border-gray-700 rounded-sm hover:bg-japanese-kinairo dark:hover:bg-gray-800 transition-colors text-japanese-sumiiro dark:text-japanese-shironezu"
          >
            ←
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-4 py-2 border border-japanese-shiraumenezu dark:border-gray-700 rounded-sm hover:bg-japanese-kinairo dark:hover:bg-gray-800 transition-colors text-japanese-sumiiro dark:text-japanese-shironezu"
          >
            今日
          </button>
          <button
            onClick={nextMonth}
            className="px-4 py-2 border border-japanese-shiraumenezu dark:border-gray-700 rounded-sm hover:bg-japanese-kinairo dark:hover:bg-gray-800 transition-colors text-japanese-sumiiro dark:text-japanese-shironezu"
          >
            →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-3">
        {dayNames.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-light tracking-wider text-japanese-ginnezu dark:text-gray-500 pb-3 uppercase"
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
                aspect-square border rounded-sm p-3 flex flex-col items-start justify-between relative
                hover:border-japanese-sumiiro dark:hover:border-japanese-shironezu hover:shadow-sm transition-all
                ${isTodayDate ? "border-japanese-sumiiro dark:border-japanese-shironezu bg-japanese-murasakisuishiyou dark:bg-gray-800 shadow-sm" : "border-japanese-shiraumenezu dark:border-gray-700"}
                ${isDraft ? "border-2 border-dashed border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-950/20" : ""}
                ${post && !isTodayDate && !isDraft ? "bg-japanese-kinairo dark:bg-gray-800/50" : ""}
                ${!post && !isTodayDate ? "bg-white dark:bg-transparent" : ""}
              `}
            >
              <div className="flex items-start justify-between w-full">
                <span
                  className={`text-sm font-light ${
                    isTodayDate
                      ? "text-japanese-sumiiro dark:text-japanese-shironezu font-medium"
                      : post
                        ? "text-japanese-sumiiro dark:text-japanese-shironezu"
                        : "text-japanese-ginnezu dark:text-gray-500"
                  }`}
                >
                  {day}
                </span>
                {isDraft && (
                  <span className="text-blue-500 dark:text-blue-400 text-[10px] font-medium uppercase tracking-wide">
                    draft
                  </span>
                )}
                {!post && (
                  <span className="text-japanese-ginnezu dark:text-gray-600 text-xs opacity-60">
                    +
                  </span>
                )}
              </div>

              {post && (
                <div className="text-left w-full">
                  <p className="text-xs text-japanese-sumiiro dark:text-japanese-shironezu font-light">
                    {post.title}
                  </p>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
