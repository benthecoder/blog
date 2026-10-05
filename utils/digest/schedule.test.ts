import { describe, expect, it } from "vitest";
import { periodAnchor, suggestPeriods } from "./schedule";
import { monthWindow, quarterWindow, weekWindow } from "./periods";

describe("suggestPeriods", () => {
  it("suggests weekly on sundays only", () => {
    expect(suggestPeriods(new Date(2026, 9, 4))).toEqual(["weekly"]); // Sun
    expect(suggestPeriods(new Date(2026, 9, 5))).toEqual([]); // Mon
  });

  it("suggests monthly on the last day, including leap-day February", () => {
    expect(suggestPeriods(new Date(2026, 9, 31))).toEqual(["monthly"]); // Sat
    expect(suggestPeriods(new Date(2028, 1, 29))).toEqual(["monthly"]);
  });

  it("adds quarterly on quarter ends", () => {
    expect(suggestPeriods(new Date(2026, 8, 30))).toEqual([
      "monthly",
      "quarterly",
    ]);
    expect(suggestPeriods(new Date(2026, 11, 31))).toEqual([
      "monthly",
      "quarterly",
    ]);
  });

  it("lists weekly before monthly when a sunday is month end", () => {
    expect(suggestPeriods(new Date(2026, 4, 31))).toEqual([
      "weekly",
      "monthly",
    ]);
  });
});

describe("periodAnchor covers the period ending on the date", () => {
  it("weekly includes the sunday itself", () => {
    const { now } = periodAnchor("weekly", new Date(2026, 9, 4));
    const w = weekWindow(now, 7);
    expect(w.until).toEqual(new Date(2026, 9, 5));
    expect(w.since.getDate()).toBe(28);
  });

  it("monthly is the month containing the date", () => {
    const a = periodAnchor("monthly", new Date(2026, 9, 31));
    expect(a.month).toBe("2026-10");
    const w = monthWindow(a.now, a.month);
    expect([w.since.getMonth(), w.until.getMonth()]).toEqual([9, 10]);
  });

  it("quarterly is the quarter ending on the date", () => {
    const { now } = periodAnchor("quarterly", new Date(2026, 8, 30));
    const w = quarterWindow(now);
    expect([w.since.getMonth(), w.until.getMonth()]).toEqual([6, 9]);
  });
});
