import { z } from "zod";
import { postDateISO } from "@/utils/dateUtils";

// One schema per content type. Each describes the frontmatter as it sits on
// disk, so a parsed file can be written back unchanged. Domain shapes such as
// `PostMetadata` (tags as an array, aliased locations) are derived from these
// in the loaders. Most objects are strict: an unknown key is a typo until
// someone adds it here.
//
// Client-safe: no fs, so the admin editor can validate what Benedict types.

export const POST_FORMAT_IDS = [
  "journal",
  "essay",
  "book",
  "links",
  "resource",
] as const;
export const postFormatSchema = z.enum(POST_FORMAT_IDS);
export type PostFormat = z.infer<typeof postFormatSchema>;

export const PLACE_CONTEXTS = ["visit", "transit", "mention"] as const;

/**
 * js-yaml turns an unquoted `2026-05-01` into a Date at UTC midnight. Read it
 * back as the `YYYY-MM-DD` text that was written, so dates stay strings.
 */
const NOT_A_DATE = 'not a date; write it like "May 27, 2023" or 2023-05-27';
const requiredOr =
  (message: string) =>
  ({ input }: { input?: unknown }) =>
    input === undefined ? "required" : message;

export const dateTextSchema = z.union(
  [z.string(), z.date().transform((d) => d.toISOString().slice(0, 10))],
  { error: requiredOr(NOT_A_DATE) }
);

/** A post date: "May 27, 2023", "Nov 12 2024", or "2023-05-27". */
const postDateSchema = dateTextSchema.refine(
  (date) => postDateISO(date) !== undefined,
  { message: NOT_A_DATE }
);

/** `tags: a, b` (the house style) or a YAML list. */
export const tagsSchema = z.union([z.string(), z.array(z.string())], {
  error: requiredOr('expected "a, b" or a list of strings'),
});

// Bibliographic fields for paper notes (`category: papers/<topic>`).
const paperFields = {
  authors: z.string().optional(),
  // `year: 2017` is a YAML number; the editor writes it that way on purpose.
  year: z.union([z.string(), z.number()]).optional(),
  url: z.string().optional(),
  read: dateTextSchema.optional(),
  source: z.string().optional(),
};

export const postFrontmatterSchema = z.strictObject({
  title: z.string(),
  date: postDateSchema,
  tags: tagsSchema.optional(),
  format: postFormatSchema.optional(),
  locations: z.array(z.string()).optional(),
  place_context: z.enum(PLACE_CONTEXTS).optional(),
  /** Set by the curius backfill script on posts it wrote. */
  backfilled_on: dateTextSchema.optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  ...paperFields,
});
export type PostFrontmatter = z.infer<typeof postFrontmatterSchema>;

export const essayFrontmatterSchema = z.strictObject({
  title: z.string(),
  subtitle: z.string().optional(),
  date: dateTextSchema,
  updated: dateTextSchema.optional(),
  tags: tagsSchema.optional(),
  format: postFormatSchema.optional(),
});
export type EssayFrontmatter = z.infer<typeof essayFrontmatterSchema>;

// Loose: wiki pages are a personal encyclopedia and may carry any extra
// metadata (the wiki editor preserves it on save). The known fields are typed.
export const wikiFrontmatterSchema = z.looseObject({
  title: z.string().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  tags: tagsSchema.optional(),
  // The wiki editor stamps a full ISO time; keep it whole when YAML dates it.
  lastUpdated: z
    .union([z.string(), z.date().transform((d) => d.toISOString())])
    .optional(),
  ...paperFields,
});
export type WikiFrontmatter = z.infer<typeof wikiFrontmatterSchema>;

export const wikiTemplateFrontmatterSchema = z.strictObject({
  label: z.string().optional(),
  order: z.number().optional(),
  category: z.string().optional(),
  tags: tagsSchema.optional(),
  paper: z.boolean().optional(),
});

export const recipeFrontmatterSchema = z.strictObject({
  title: z.string().optional(),
  description: z.string().optional(),
  image: z.string().optional(),
  lastUpdated: dateTextSchema.optional(),
});

/** Pages that are only a Markdown body, like library.md and projects.md. */
export const bodyOnlySchema = z.strictObject({});

// What the editor holds while Benedict types: the post template leaves
// `title:` and `tags:` blank (YAML null), and a bare `title: 2026` is a
// number. Loose, because the save route only sends the fields it knows; the
// server checks the merged result against the strict schema before writing.
const typedText = z
  .union([z.string(), z.number(), z.boolean()])
  .transform(String)
  .nullish();

export const draftFrontmatterSchema = z.looseObject({
  title: typedText,
  subtitle: typedText,
  tags: z
    .union([typedText, z.array(z.string()).transform((t) => t.join(", "))])
    .nullish(),
  date: dateTextSchema.nullish(),
  updated: dateTextSchema.nullish(),
  format: postFormatSchema.nullish(),
});
export type DraftFrontmatter = z.infer<typeof draftFrontmatterSchema>;
