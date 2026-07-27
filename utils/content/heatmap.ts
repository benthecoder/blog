import type { PostMetadata } from "@/types/post";

export interface DayData {
  date: Date;
  posts: PostMetadata[];
  dateKey: string;
}

export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function groupPostsByDate(
  posts: PostMetadata[]
): Record<string, PostMetadata[]> {
  const map: Record<string, PostMetadata[]> = {};
  posts.forEach((post) => {
    (map[dateKey(new Date(post.date))] ??= []).push(post);
  });
  return map;
}

/**
 * All days of `year` organized into Sunday-to-Saturday weeks, padded at both
 * ends so the grid starts on a Sunday and ends on a Saturday. Posts are only
 * attached to days inside the calendar year.
 */
export function buildWeeks(
  year: number,
  postsByDate: Record<string, PostMetadata[]>
): DayData[][] {
  const startDate = new Date(year, 0, 1);
  startDate.setDate(startDate.getDate() - startDate.getDay());

  const endDate = new Date(year, 11, 31);
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

  const weeks: DayData[][] = [];
  let currentWeek: DayData[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const key = dateKey(currentDate);
    const dayPosts =
      currentDate.getFullYear() === year ? postsByDate[key] || [] : [];

    currentWeek.push({
      date: new Date(currentDate),
      posts: dayPosts,
      dateKey: key,
    });

    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  return weeks;
}

const MONTH_NAMES = [
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

/** Month label for each week that contains the 1st of a month in `year`. */
export function getMonthLabels(
  weeks: DayData[][],
  year: number
): Map<number, string> {
  const labels = new Map<number, string>();
  weeks.forEach((week, weekIndex) => {
    week.forEach((day) => {
      if (day.date.getDate() === 1 && day.date.getFullYear() === year) {
        labels.set(weekIndex, MONTH_NAMES[day.date.getMonth()]);
      }
    });
  });
  return labels;
}

export function totalWordCount(posts: PostMetadata[]): number {
  return posts.reduce((sum, post) => sum + (post.wordcount || 0), 0);
}

/** Word-count buckets → cell color classes (light and dark). */
export const WORD_COUNT_SCALE: { max: number; className: string }[] = [
  { max: 0, className: "bg-rule/20 dark:bg-night-rule/20" },
  {
    max: 300,
    className: "bg-ink/30 dark:bg-chalk/30",
  },
  {
    max: 800,
    className: "bg-ink/60 dark:bg-chalk/60",
  },
  {
    max: Infinity,
    className: "bg-ink/90 dark:bg-chalk/90",
  },
];

export function wordCountColor(posts: PostMetadata[]): string {
  const words = totalWordCount(posts);
  return WORD_COUNT_SCALE.find(({ max }) => words <= max)!.className;
}
