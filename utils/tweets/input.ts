import { z } from "zod";
import { parsePublicUrl } from "./link";

import { THOUGHT_MAX_LENGTH } from "@/config/constants";
export const thoughtInputSchema = z.object({
  body: z.string().max(THOUGHT_MAX_LENGTH).default(""),
  link: z
    .string()
    .trim()
    .max(2048)
    .default("")
    .refine((value) => !value || parsePublicUrl(value) !== null),
  title: z.string().max(300).optional(),
});
