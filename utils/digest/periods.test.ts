import { describe, expect, it } from "vitest";
import { monthWindow, quarterWindow, weekWindow } from "./periods";

const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

describe("monthWindow", () => {
  it("defaults to the month that just ended", () => {
    const w = monthWindow(new Date(2026, 9, 4));
    expect([ymd(w.since), ymd(w.until)]).toEqual(["2026-09-01", "2026-10-01"]);
  });

  it("rolls January back into December of the previous year", () => {
    const w = monthWindow(new Date(2027, 0, 3));
    expect([ymd(w.since), ymd(w.until)]).toEqual(["2026-12-01", "2027-01-01"]);
  });

  it("honours an explicit month and rejects malformed ones", () => {
    const w = monthWindow(new Date(2026, 9, 4), "2026-02");
    expect([ymd(w.since), ymd(w.until)]).toEqual(["2026-02-01", "2026-03-01"]);
    expect(() => monthWindow(new Date(), "sep")).toThrow(/--month/);
    expect(() => monthWindow(new Date(), "2026-13")).toThrow(/--month/);
  });
});

describe("quarterWindow", () => {
  it.each([
    [new Date(2026, 9, 4), "2026-07-01", "2026-10-01"],
    [new Date(2026, 0, 10), "2025-10-01", "2026-01-01"],
    [new Date(2026, 3, 1), "2026-01-01", "2026-04-01"],
  ])("%s", (now, since, until) => {
    const w = quarterWindow(now);
    expect([ymd(w.since), ymd(w.until)]).toEqual([since, until]);
  });
});

describe("weekWindow", () => {
  it("spans the given number of days ending now", () => {
    const now = new Date(2026, 9, 4, 21);
    const w = weekWindow(now, 7);
    expect(w.until).toBe(now);
    expect(now.getTime() - w.since.getTime()).toBe(7 * 86_400_000);
  });
});
