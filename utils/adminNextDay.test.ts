import { describe, expect, it } from "vitest";
import { nextPostDay, nextDayHref } from "./adminNextDay";
describe("next day after deleting a post", () => {
  it.each([
    ["160326", "170326", "2026-03-17"],
    ["310326", "010426", "2026-04-01"],
    ["311226", "010127", "2027-01-01"],
    ["280224", "290224", "2024-02-29"],
    ["280226", "010326", "2026-03-01"],
    ["011126", "021126", "2026-11-02"],
  ])("advances %s by one calendar day", (slug, next, date) => {
    expect(nextPostDay(slug, "")).toMatchObject({ slug: next, date });
  });
  it("opens the actual next day, or creates an empty day without reopening the deleted slug", () => {
    const day = nextPostDay("310326", "");
    expect(nextDayHref(day, true)).toBe("/admin/edit/010426?month=2026-04");
    expect(nextDayHref(day, false)).toBe(
      "/admin/edit/new?date=2026-04-01&month=2026-04"
    );
  });
  it("supports named posts using their frontmatter date and handles invalid dates safely", () => {
    expect(nextPostDay("a-story", "Mar 16, 2026")?.slug).toBe("170326");
    expect(nextPostDay("310226", "")).toBeNull();
    expect(nextDayHref(nextPostDay("untitled", "invalid"), false)).toBe(
      "/admin"
    );
  });
});
