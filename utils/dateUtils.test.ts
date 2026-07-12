import { describe, expect, it } from "vitest";
import { extractPostDate, toISODateString } from "./dateUtils";

describe("extractPostDate", () => {
  it("parses ISO frontmatter dates", () => {
    const d = extractPostDate("posts/x.md", { date: "2024-03-15" });
    expect(toISODateString(d)).toBe("2024-03-15");
  });

  it("parses written month names, with and without comma", () => {
    expect(
      extractPostDate("posts/x.md", { date: "March 15, 2024" }).getMonth()
    ).toBe(2);
    expect(
      extractPostDate("posts/x.md", { date: "mar 5 2024" }).getDate()
    ).toBe(5);
  });

  it("falls back to MMDDYY filename when frontmatter is missing", () => {
    const d = extractPostDate("posts/010225.md", null);
    expect(d.getFullYear()).toBe(2025);
    expect(d.getMonth()).toBe(0);
    expect(d.getDate()).toBe(2);
  });

  it("falls back to the default date when nothing parses", () => {
    const d = extractPostDate("posts/yosemite.md", { date: "not a date" });
    expect(d.getFullYear()).toBe(2020);
  });
});
