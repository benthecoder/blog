import { describe, expect, it } from "vitest";
import {
  buildWeeks,
  dateKey,
  getMonthLabels,
  groupPostsByDate,
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
