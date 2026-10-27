import { describe, expect, it } from "vitest";
import { buildSameDayIndex } from "./onThisDay";

const post = (slug: string, date: string) => ({ slug, title: slug, date });

describe("buildSameDayIndex", () => {
  const { byDay, dayBySlug } = buildSameDayIndex([
    post("c", "Apr 1, 2025"),
    post("a", "Apr 1, 2023"),
    post("b", "Apr 1, 2024"),
    post("other", "Apr 2, 2024"),
    post("odd", "Nov 22 2023"),
    post("bad", "not a date"),
    post("leap", "Feb 29, 2024"),
  ]);

  it("groups same month+day across years, oldest first", () => {
    const years = byDay.get(dayBySlug.get("a")!)!.map((p) => p.year);
    expect(years).toEqual([2023, 2024, 2025]);
    expect(byDay.get(dayBySlug.get("a")!)!.map((p) => p.slug)).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  it("keeps other days separate and parses odd formats", () => {
    expect(byDay.get(dayBySlug.get("other")!)).toHaveLength(1);
    expect(byDay.get(dayBySlug.get("odd")!)![0].year).toBe(2023);
    expect(byDay.get(dayBySlug.get("leap")!)).toHaveLength(1);
  });

  it("skips invalid dates", () => {
    expect(dayBySlug.has("bad")).toBe(false);
  });
});
