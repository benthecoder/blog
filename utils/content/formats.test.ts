import { describe, expect, it } from "vitest";
import { formatOf, matchesFormat, formatForLegacyTag } from "./formats";
import { migrateFormat, ESSAY_SLUGS } from "./formatMigration";

describe("post formats", () => {
  it("defaults only date-named posts to journal and honors an explicit format", () => {
    expect(formatOf("241024", {})).toBe("journal");
    expect(formatOf("thoughts", {})).toBeUndefined();
    expect(formatOf("2023", {})).toBeUndefined();
    expect(formatOf("311225", { format: "essay" })).toBe("essay");
    expect(formatOf("thoughts", { format: "unknown" })).toBeUndefined();
  });

  it("keeps date-named essays in both views and supports named journals", () => {
    const essay = { slug: "311225", format: "essay" as const };
    expect(matchesFormat(essay, "journal")).toBe(true);
    expect(matchesFormat(essay, "essay")).toBe(true);
    expect(matchesFormat(essay, "book")).toBe(false);
    expect(matchesFormat({ slug: "trip", format: "journal" }, "journal")).toBe(
      true
    );
    expect(matchesFormat({ slug: "values", format: "essay" }, "journal")).toBe(
      false
    );
  });

  it("maps retired tag URLs while leaving topics and future wiki posts alone", () => {
    expect(formatForLegacyTag("book")).toBe("book");
    expect(formatForLegacyTag("listicles")).toBe("resource");
    expect(formatForLegacyTag("✰")).toBe("essay");
    expect(formatForLegacyTag("whatis")).toBeUndefined();
    expect(formatForLegacyTag("AI")).toBeUndefined();
  });
});

describe("format migration", () => {
  it("migrates the supplied essays, overriding legacy book/journal tags", () => {
    expect([...ESSAY_SLUGS].sort()).toEqual([
      "2023",
      "281024",
      "311224",
      "311225",
      "curseddreams",
      "isu",
      "nightbefore",
      "strangers",
    ]);
    const result = migrateFormat("311224", {
      tags: "journal, book, life, ✰",
    });
    expect(result.data).toEqual({ tags: "life", format: "essay" });
    for (const slug of [
      "060425",
      "280724",
      "backhome",
      "310324",
      "isuclasses",
    ]) {
      expect(migrateFormat(slug, { tags: "life" }).format).not.toBe("essay");
    }
    expect(migrateFormat("030325", { tags: "journal, chats" }).format).toBe(
      "journal"
    );
    expect(
      migrateFormat("learning-programmers", { tags: "learning" }).format
    ).toBeUndefined();
  });

  it("keeps existing explicit choices and never treats a star alone as an essay", () => {
    expect(
      migrateFormat("22", { format: "book", tags: "✰, book, life" }).data
    ).toEqual({ format: "book", tags: "life" });
    expect(migrateFormat("summary", { tags: "✰, advice" }).data).toEqual({
      tags: "advice",
    });
    expect(() =>
      migrateFormat("bad", { format: "books", tags: "book" })
    ).toThrow(/unknown format/);
  });

  it("finds weekly issues by title even without a links tag", () => {
    expect(
      migrateFormat("250525", {
        title: "sunday links #14",
        tags: "journal, reading",
      }).data
    ).toEqual({ title: "sunday links #14", tags: "reading", format: "links" });
  });

  it("preserves topics, metadata, array tags and the whatis tag until the wiki move", () => {
    const date = new Date("2026-10-01");
    const result = migrateFormat("guide", {
      date,
      subtitle: "A guide",
      tags: ["resources", "listicles", "coding", "whatis"],
    });
    expect(result.data).toEqual({
      date,
      subtitle: "A guide",
      tags: ["coding", "whatis"],
      format: "resource",
    });
  });

  it("does not write redundant defaults and is idempotent for every selection", () => {
    expect(migrateFormat("241024", { tags: "journal" }).data).toEqual({});
    for (const [slug, data] of [
      ["241024", { tags: "journal, life" }],
      ["22", { tags: "journal, ✰" }],
      ["roundup", { tags: "links" }],
      ["reading", { tags: ["book", "reading"] }],
      ["tools", { tags: "listicles, resources" }],
      ["trip", { tags: "journal, travel" }],
      ["airflow", { tags: "whatis, tech" }],
    ] as const) {
      const first = migrateFormat(slug, data);
      expect(migrateFormat(slug, first.data).changed).toBe(false);
    }
  });
});
