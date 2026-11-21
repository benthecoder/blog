import { describe, expect, it } from "vitest";
import {
  formatWeekRange,
  missedWeekCount,
  weeks,
  weeksNewestFirst,
  type LearningWeek,
} from "@/data/learning";

const week = (
  start: string,
  end: string,
  stat: LearningWeek["stat110"]["status"],
  alchemy: LearningWeek["alchemy"]["status"]
): LearningWeek => ({
  start,
  end,
  stat110: { status: stat, lecture: "Lecture 1, Probability and Counting" },
  alchemy: { status: alchemy, unit: "Unit 1, Basics" },
});

describe("learning weeks", () => {
  it("seeds the first week as upcoming with no scores", () => {
    expect(weeks).toEqual([
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
    ]);
    expect(missedWeekCount()).toBe(0);
  });

  it("counts a week as missed when either session was missed", () => {
    expect(
      missedWeekCount([
        week("2026-11-16", "2026-11-22", "done", "done"),
        week("2026-11-23", "2026-11-29", "missed", "done"),
        week("2026-11-30", "2026-12-06", "upcoming", "upcoming"),
      ])
    ).toBe(1);
    expect(
      missedWeekCount([week("2026-11-16", "2026-11-22", "missed", "missed")])
    ).toBe(1);
  });

  it("formats week ranges without a timezone shift", () => {
    expect(formatWeekRange("2026-11-16", "2026-11-22")).toBe("Nov 16–22, 2026");
    expect(formatWeekRange("2026-11-30", "2026-12-06")).toBe(
      "Nov 30–Dec 6, 2026"
    );
    expect(formatWeekRange("2026-12-28", "2027-01-03")).toBe(
      "Dec 28, 2026–Jan 3, 2027"
    );
  });

  it("shows newer weeks first without changing the source order", () => {
    const rows = [
      week("2026-11-16", "2026-11-22", "done", "done"),
      week("2026-11-23", "2026-11-29", "upcoming", "upcoming"),
    ];
    expect(weeksNewestFirst(rows).map((row) => row.start)).toEqual([
      "2026-11-23",
      "2026-11-16",
    ]);
    expect(rows[0].start).toBe("2026-11-16");
  });
});
