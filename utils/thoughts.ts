import { z } from "zod";

/**
 * A row of the Neon `tweets` table, as the driver returns it (checked
 * against information_schema: id integer, content text not null, link and
 * link_title nullable text, created_at timestamptz, which arrives as a Date).
 */
export const tweetRowSchema = z.object({
  id: z.number().int().positive(),
  content: z.string(),
  link: z.string().nullable(),
  link_title: z.string().nullable(),
  created_at: z.date(),
});
export type TweetRow = z.infer<typeof tweetRowSchema>;

/** What /thoughts selects: the link is folded into `content`. */
export const thoughtRowSchema = tweetRowSchema.pick({
  id: true,
  content: true,
  created_at: true,
});

/** The same row after JSON, from /api/thoughts: the timestamp is a string. */
export const thoughtJsonSchema = thoughtRowSchema.extend({
  created_at: z.string().refine((s) => Number.isFinite(Date.parse(s)), {
    message: "not a timestamp",
  }),
});

export type ThoughtJson = z.infer<typeof thoughtJsonSchema>;
export type Thought = z.infer<typeof thoughtRowSchema> | ThoughtJson;

/** Validate query results once, where they leave the database. */
export function parseRows<S extends z.ZodType>(
  schema: S,
  rows: unknown,
  query: string
): z.output<S>[] {
  const result = z.array(schema).safeParse(rows);
  if (!result.success)
    throw new Error(
      `${query}: unexpected row shape\n${z.prettifyError(result.error)}`
    );
  return result.data;
}
