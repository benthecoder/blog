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

/** What /thoughts and /api/thoughts select, including the stored link. */
export const thoughtRowSchema = tweetRowSchema.pick({
  id: true,
  content: true,
  link: true,
  link_title: true,
  created_at: true,
});

export type ThoughtRow = z.infer<typeof thoughtRowSchema>;

/** A thought ready to render: titles are resolved, link_title is folded in. */
export const thoughtJsonSchema = z.object({
  id: z.number().int().positive(),
  content: z.string(),
  link: z.string().nullable().optional().default(null),
  created_at: z.string().refine((s) => Number.isFinite(Date.parse(s)), {
    message: "not a timestamp",
  }),
  titles: z.record(z.string(), z.string()).optional().default({}),
});

export type ThoughtJson = z.infer<typeof thoughtJsonSchema>;

export type ThoughtView = Omit<ThoughtJson, "created_at"> & {
  created_at: Date | string;
};

/** What the /thoughts client holds: the initial page or a later JSON page. */
export type Thought = ThoughtView;

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
