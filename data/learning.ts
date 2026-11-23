export type SessionStatus = "done" | "missed" | "upcoming";

export type Stat110Session = {
  status: SessionStatus;
  lecture: string;
  /** Problem score, e.g. "8/10". Leave off until graded. */
  score?: string;
};

export type AlchemySession = {
  status: SessionStatus;
  unit: string;
  /** Quiz prediction, written before the quiz. */
  prediction?: string;
  /** Actual quiz result. */
  result?: string;
};

export type LearningWeek = {
  /** Inclusive Monday, YYYY-MM-DD. */
  start: string;
  /** Inclusive Sunday, YYYY-MM-DD. */
  end: string;
  stat110: Stat110Session;
  alchemy: AlchemySession;
};

/**
 * Weekly follow-through for /learning.
 * Append a new object after each weekend. Newest weeks can go at the bottom;
 * the page shows them first.
 *
 * {
 *   start: "2026-11-23",
 *   end: "2026-11-29",
 *   stat110: {
 *     status: "done",
 *     lecture: "Lecture 2, Story Proofs, Axioms, and Sets",
 *     score: "8/10",
 *   },
 *   alchemy: {
 *     status: "done",
 *     unit: "Unit 1, Basics",
 *     prediction: "accuracy drops when the context is shuffled",
 *     result: "4 of 6",
 *   },
 * }
 */
export const weeks: LearningWeek[] = [
  {
    start: "2026-11-16",
    end: "2026-11-22",
    stat110: {
      status: "upcoming",
      lecture: "Lecture 1, Probability and Counting",
    },
    alchemy: {
      status: "upcoming",
      unit: "Unit 1, Basics",
    },
  },
];

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

function parseISODate(iso: string): Date {
  const match = ISO_DATE.exec(iso);
  if (!match) throw new Error(`Invalid date: ${iso}`);
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

const monthDay = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});
const monthDayYear = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export function formatWeekRange(start: string, end: string): string {
  const from = parseISODate(start);
  const to = parseISODate(end);
  if (from.getFullYear() !== to.getFullYear()) {
    return `${monthDayYear.format(from)}–${monthDayYear.format(to)}`;
  }
  if (from.getMonth() !== to.getMonth()) {
    return `${monthDay.format(from)}–${monthDayYear.format(to)}`;
  }
  const month = new Intl.DateTimeFormat("en-US", { month: "short" }).format(
    from
  );
  return `${month} ${from.getDate()}–${to.getDate()}, ${to.getFullYear()}`;
}

export function missedWeekCount(rows: LearningWeek[] = weeks): number {
  return rows.filter(
    (week) =>
      week.stat110.status === "missed" || week.alchemy.status === "missed"
  ).length;
}

export function weeksNewestFirst(rows: LearningWeek[] = weeks): LearningWeek[] {
  return [...rows].sort((a, b) =>
    a.start < b.start ? 1 : a.start > b.start ? -1 : 0
  );
}
