import { describe, expect, it } from "vitest";
import { extractPostDate, postDateISO, toISODateString } from "./dateUtils";

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

describe("toISODateString", () => {
  it("keeps the local calendar day for written dates", () => {
    const d = extractPostDate("posts/x.md", { date: "Jan 5, 2024" });
    expect(toISODateString(d)).toBe("2024-01-05");
  });

  it("keeps the local calendar day for filename dates", () => {
    expect(toISODateString(extractPostDate("posts/010524.md", null))).toBe(
      "2024-01-05"
    );
  });
});

describe("postDateISO", () => {
  it("normalizes frontmatter date forms to YYYY-MM-DD", () => {
    expect(postDateISO("Dec 29, 2025")).toBe("2025-12-29");
    expect(postDateISO("Jun 1, 2024")).toBe("2024-06-01");
    expect(postDateISO("2025-01-02")).toBe("2025-01-02");
  });

  it("returns undefined for garbage", () => {
    expect(postDateISO("not a date")).toBeUndefined();
  });
});
