import { describe, expect, it } from "vitest";
import { dayHref, monthHref, monthOf } from "./adminDayNav";

describe("editor day navigation", () => {
  it("reads the month from a date", () => {
    expect(monthOf("2026-03-14")).toBe("2026-03");
  });

  it("opens the existing post for a day, else a new one", () => {
    expect(dayHref("2026-03-02", ["020326"])).toBe("/admin/edit/020326");
    expect(dayHref("2026-03-03", ["020326"])).toBe(
      "/admin/edit/new?date=2026-03-03"
    );
  });

  it("steps a month across a year boundary to its first post", () => {
    expect(monthHref("2026-01-15", -1, ["301225", "151225"])).toBe(
      "/admin/edit/151225"
    );
    expect(monthHref("2026-03-15", 1, [])).toBe(
      "/admin/edit/new?date=2026-04-01"
    );
  });
});
