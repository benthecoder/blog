import { describe, expect, it } from "vitest";
import {
  buildWeeks,
  dateKey,
  getMonthLabels,
  groupPostsByDate,
  longestRun,
  yearSummary,
  wordCountColor,
  WORD_COUNT_SCALE,
} from "./heatmap";
import type { PostMetadata } from "@/types/post";

describe("dateKey", () => {
  it("zero-pads month and day", () => {
    expect(dateKey(new Date(2025, 0, 2))).toBe("2025-01-02");
  });
});

describe("groupPostsByDate", () => {
  it("groups posts on the same day", () => {
    const posts = [
      { date: "2025-01-02T08:00:00" },
      { date: "2025-01-02T20:00:00" },
      { date: "2025-01-03T00:00:00" },
    ] as PostMetadata[];
    const grouped = groupPostsByDate(posts);
    expect(grouped["2025-01-02"]).toHaveLength(2);
    expect(grouped["2025-01-03"]).toHaveLength(1);
  });
});

describe("buildWeeks", () => {
  it("always yields full sunday-to-saturday weeks", () => {
    const weeks = buildWeeks(2025, {});
    expect(weeks.every((w) => w.length === 7)).toBe(true);
    expect(weeks[0][0].date.getDay()).toBe(0);
    expect(weeks.at(-1)![6].date.getDay()).toBe(6);
  });

  it("only attaches posts to days inside the year", () => {
    // 2024-12-29 is a Sunday in the padding before 2025 starts
    const posts = [{ date: "2024-12-29" } as PostMetadata];
    const weeks = buildWeeks(2025, { "2024-12-29": posts });
    const padded = weeks[0].find((d) => d.dateKey === "2024-12-29");
    expect(padded?.posts).toEqual([]);
  });
});

describe("getMonthLabels", () => {
  it("labels the week containing each month's 1st", () => {
    const labels = getMonthLabels(buildWeeks(2025, {}), 2025);
    expect([...labels.values()]).toHaveLength(12);
    expect(labels.get(0)).toBe("jan");
  });
});

describe("wordCountColor", () => {
  it("maps word counts to buckets", () => {
    const post = (wordcount: number) => ({ wordcount }) as PostMetadata;
    expect(wordCountColor([])).toBe(WORD_COUNT_SCALE[0].className);
    expect(wordCountColor([post(100)])).toBe(WORD_COUNT_SCALE[1].className);
    expect(wordCountColor([post(500)])).toBe(WORD_COUNT_SCALE[2].className);
    expect(wordCountColor([post(5000)])).toBe(WORD_COUNT_SCALE[3].className);
  });
});

describe("longestRun", () => {
  it("returns null for empty input", () => {
    expect(longestRun([])).toBeNull();
  });

  it("finds the longest run across gaps and ignores duplicates/order", () => {
    const run = longestRun([
      "2025-03-05",
      "2025-03-01",
      "2025-03-02",
      "2025-03-02",
      "2025-03-03",
      "2025-03-07",
    ]);
    expect(run).toEqual({ length: 3, start: "2025-03-01", end: "2025-03-03" });
  });

  it("is consecutive across month, year and leap boundaries", () => {
    expect(longestRun(["2023-12-31", "2024-01-01"])?.length).toBe(2);
    expect(longestRun(["2024-02-28", "2024-02-29", "2024-03-01"])?.length).toBe(
      3
    );
    expect(longestRun(["2023-02-28", "2023-03-01"])?.length).toBe(2);
    expect(longestRun(["2023-02-28", "2023-02-29x"])?.length).toBe(1);
  });

  it("is DST-safe", () => {
    expect(longestRun(["2025-03-08", "2025-03-09", "2025-03-10"])?.length).toBe(
      3
    );
    expect(longestRun(["2025-11-01", "2025-11-02", "2025-11-03"])?.length).toBe(
      3
    );
  });
});

describe("yearSummary", () => {
  const mk = (date: string, wordcount = 10) =>
    ({ date: `${date}T00:00:00`, wordcount }) as PostMetadata;
  const daysOf = (year: number) => {
    const out: PostMetadata[] = [];
    const d = new Date(year, 0, 1);
    while (d.getFullYear() === year) {
      out.push(mk(dateKey(d)));
      d.setDate(d.getDate() + 1);
    }
    return out;
  };

  it("handles an empty year", () => {
    expect(yearSummary([mk("2025-01-01")], 2024)).toEqual({
      posts: 0,
      words: 0,
      everyDay: false,
      longestRunInYear: 0,
      partOf: null,
    });
  });

  it("detects every day in a leap year and a non-leap year", () => {
    expect(yearSummary(daysOf(2024), 2024).everyDay).toBe(true);
    expect(yearSummary(daysOf(2024), 2024).posts).toBe(366);
    expect(yearSummary(daysOf(2025), 2025).everyDay).toBe(true);
    expect(yearSummary(daysOf(2024).slice(1), 2024).everyDay).toBe(false);
  });

  it("does not count duplicate days toward everyDay", () => {
    const posts = [...daysOf(2025).slice(1), mk("2025-01-02")];
    expect(posts).toHaveLength(365);
    expect(yearSummary(posts, 2025).everyDay).toBe(false);
  });

  it("sums words and reports in-year run", () => {
    const s = yearSummary(
      [mk("2025-05-01", 5), mk("2025-05-02", 7), mk("2025-05-10", 1)],
      2025
    );
    expect(s.words).toBe(13);
    expect(s.longestRunInYear).toBe(2);
    expect(s.partOf).toBeNull();
  });

  it("sets partOf only when the longest run spans beyond the year", () => {
    const posts = [...daysOf(2024), ...daysOf(2025)];
    const s = yearSummary(posts, 2025);
    expect(s.partOf).toEqual({
      length: 731,
      start: "2024-01-01",
      end: "2025-12-31",
    });
    expect(yearSummary(posts, 2023).partOf).toBeNull();
    expect(yearSummary(daysOf(2025), 2025).partOf).toBeNull();
  });
});
