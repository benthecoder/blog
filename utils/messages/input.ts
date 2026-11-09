import { z } from "zod";

export const MESSAGE_MAX_LENGTH = 2000;
export const SENDER_MAX_LENGTH = 100;

/** A visitor's note from /contact. `website` is a honeypot: the field is
    hidden from people, so only bots fill it in. */
export const messageInputSchema = z.object({
  body: z.string().trim().min(1).max(MESSAGE_MAX_LENGTH),
  sender: z
    .string()
    .trim()
    .max(SENDER_MAX_LENGTH)
    .default("")
    .transform((value) => value || null),
  website: z.string().default(""),
});
