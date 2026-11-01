import type { PaperFields } from "@/types/wiki";
import type { PostFrontmatter, WikiFrontmatter } from "./schemas";

export const PAPER_FIELD_KEYS = [
  "authors",
  "year",
  "url",
  "read",
  "source",
] as const satisfies readonly (keyof PaperFields)[];

export const EMPTY_PAPER_FIELDS: PaperFields = {
  authors: "",
  year: "",
  url: "",
  read: "",
  source: "",
};

/** Paper notes live under `papers/<topic>`. */
export function isPaperCategory(category: string): boolean {
  return /^papers(\/|$)/.test(category.trim());
}

/** Read paper fields from validated frontmatter; missing fields become "". */
export function readPaperFields(
  data: Pick<PostFrontmatter | WikiFrontmatter, keyof PaperFields>
): PaperFields {
  const fields = { ...EMPTY_PAPER_FIELDS };
  for (const key of PAPER_FIELD_KEYS)
    fields[key] = String(data[key] ?? "").trim();
  return fields;
}

/** Frontmatter for non-empty paper fields; `year` is written as a number when it is one. */
export function paperFrontmatter(
  fields: Partial<PaperFields>
): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const key of PAPER_FIELD_KEYS) {
    const value = fields[key]?.trim();
    if (!value) continue;
    out[key] = key === "year" && /^\d{4}$/.test(value) ? Number(value) : value;
  }
  return out;
}
