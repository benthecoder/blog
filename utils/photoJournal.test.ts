import { describe, expect, it } from "vitest";
import { journalSlugFor } from "./photoJournal";

const slugs = new Set(["180725", "050126"]);

describe("journalSlugFor", () => {
  it("matches the post written the same day", () => {
    expect(journalSlugFor("2025-07-18", slugs)).toBe("180725");
    expect(journalSlugFor("2025-07-18T23:30:00-07:00", slugs)).toBe("180725");
  });

  it("returns undefined when no post exists that day", () => {
    expect(journalSlugFor("2025-07-19", slugs)).toBeUndefined();
  });

  it("returns undefined for missing or invalid dates", () => {
    expect(journalSlugFor(undefined, slugs)).toBeUndefined();
    expect(journalSlugFor("", slugs)).toBeUndefined();
    expect(journalSlugFor("not a date", slugs)).toBeUndefined();
    expect(journalSlugFor("18/07/2025", slugs)).toBeUndefined();
  });

  it("keeps single-digit day and month padding", () => {
    expect(journalSlugFor("2026-01-05", slugs)).toBe("050126");
  });
});
