import { createHash } from "node:crypto";
import { z } from "zod";
import { isSafeSlug } from "@/config/paths";
import { formatOf } from "./formats";
import type { PostFrontmatter } from "./schemas";
import { parseTags } from "./tags";
import { parseLocations } from "./travel";

export const auditDecisionSchema = z.object({
  id: z.string().refine((id) => {
    const [kind, slug, extra] = id.split("/");
    return (
      (kind === "published" || kind === "drafts") &&
      isSafeSlug(slug) &&
      extra === undefined
    );
  }, "Invalid audit ID"),
  format: z.enum(["journal", "essay", "book", "links", "resource"]).nullable(),
  tags: z.array(z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)).max(6),
  locations: z.array(z.string().trim().min(1)).max(3),
  bodyHash: z.string().regex(/^[a-f0-9]{64}$/),
  reason: z.string(),
  needsReview: z.boolean(),
});

export type PostAuditDecision = z.infer<typeof auditDecisionSchema>;

export function postBodyHash(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

/** The audit may edit only formats, topic tags, and explicit destinations. */
export function auditedMetadata(
  slug: string,
  data: PostFrontmatter,
  content: string,
  decision: PostAuditDecision
) {
  if (postBodyHash(content) !== decision.bodyHash)
    throw new Error(`${decision.id}: body changed since review`);
  const next = { ...data };
  const tags = [...new Set(decision.tags)];
  if (tags.length)
    next.tags = Array.isArray(data.tags) ? tags : tags.join(", ");
  else delete next.tags;
  if (decision.format && decision.format !== formatOf(slug, {}))
    next.format = decision.format;
  else delete next.format;
  const locations = parseLocations(decision.locations);
  if (locations.length) next.locations = locations;
  else delete next.locations;
  return {
    data: next,
    changed: JSON.stringify(data) !== JSON.stringify(next),
    oldTags: parseTags(data.tags),
  };
}
