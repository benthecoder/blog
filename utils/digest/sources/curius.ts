import { z } from "zod";
import type { LinkSource } from "../types";

const USER_ID = 2790;
const MAX_PAGES = 20;

const curiusHighlightSchema = z.object({
  highlight: z.string().nullable().optional(),
  comment: z
    .union([
      z.string(),
      z.object({
        text: z.string().nullable().optional(),
        userId: z.number().nullable().optional(),
      }),
    ])
    .nullable()
    .optional(),
});

const curiusResponseSchema = z.object({
  userSaved: z
    .array(
      z.object({
        link: z.string(),
        title: z.string(),
        createdDate: z.string(),
        highlights: z.array(curiusHighlightSchema).nullable().optional(),
      })
    )
    .nullable()
    .optional(),
});

// `/links` is paginated newest-first and, unlike `/searchLinks`, includes
// highlights.
export const curius: LinkSource = {
  name: "curius",
  async fetch(since, until) {
    const out = [];
    // Bound the whole pagination run as well as each request/body read.
    const deadline = AbortSignal.timeout(30_000);
    for (let page = 0; page < MAX_PAGES; page++) {
      deadline.throwIfAborted();
      const res = await fetch(
        `https://curius.app/api/users/${USER_ID}/links?page=${page}`,
        {
          cache: "no-store",
          signal: AbortSignal.any([deadline, AbortSignal.timeout(10_000)]),
        }
      );
      if (!res.ok) {
        await res.body?.cancel();
        throw new Error(`curius ${res.status}`);
      }
      const { userSaved } = curiusResponseSchema.parse(await res.json());
      if (!userSaved?.length) break;

      for (const l of userSaved) {
        const saved = new Date(l.createdDate);
        if (saved < since || saved >= until) continue;
        const marks = (l.highlights ?? []).filter(
          (h): h is typeof h & { highlight: string } =>
            typeof h.highlight === "string" && Boolean(h.highlight.trim())
        );
        out.push({
          url: l.link,
          title: l.title,
          savedAt: new Date(l.createdDate),
          highlights: marks.map((h) => h.highlight.trim()),
          take:
            (l.highlights ?? [])
              .map((h) =>
                typeof h.comment === "string"
                  ? h.comment.trim()
                  : h.comment?.userId === USER_ID
                    ? h.comment.text?.trim()
                    : ""
              )
              .filter(Boolean)
              .join(" ") || undefined,
        });
      }
      if (new Date(userSaved[userSaved.length - 1].createdDate) < since) break;
    }
    return out;
  },
};
