// pnpm audit:apply <review.jsonl> [--include-drafts] [--write]
// Decisions stay in the ignored local plans directory; post metadata is the
// published source of truth. No providers or models are called by this script.
import fs from "node:fs";
import path from "node:path";
import { POSTS_DIR, DRAFTS_DIR } from "@/config/paths";
import { scanMarkdownDir, writeMarkdownFile } from "@/utils/content/markdown";
import {
  auditDecisionSchema,
  auditedMetadata,
  type PostAuditDecision,
} from "@/utils/content/postAudit";

const [input, ...flags] = process.argv.slice(2);
if (
  !input ||
  flags.some((flag) => !["--write", "--include-drafts"].includes(flag))
)
  throw new Error(
    "usage: pnpm audit:apply <review.jsonl> [--include-drafts] [--write]"
  );
const includeDrafts = flags.includes("--include-drafts");
const decisions = new Map<string, PostAuditDecision>();
for (const line of fs
  .readFileSync(input, "utf8")
  .split(/\r?\n/)
  .filter(Boolean)) {
  const decision = auditDecisionSchema.parse(JSON.parse(line));
  if (decisions.has(decision.id))
    throw new Error(`Duplicate audit ID: ${decision.id}`);
  decisions.set(decision.id, decision);
}
// Validate complete coverage and body hashes before the first write.
const plan = [
  { dir: POSTS_DIR, kind: "published" },
  ...(includeDrafts ? [{ dir: DRAFTS_DIR, kind: "drafts" }] : []),
].flatMap(({ dir, kind }) =>
  scanMarkdownDir(dir).map(({ slug, data, content }) => {
    const id = `${kind}/${slug}`;
    const decision = decisions.get(id);
    if (!decision) throw new Error(`Missing audit decision: ${id}`);
    return {
      file: path.join(dir, `${slug}.md`),
      content,
      id,
      ...auditedMetadata(slug, data, content, decision),
    };
  })
);
const ids = new Set(plan.map(({ id }) => id));
for (const id of decisions.keys()) {
  if ((includeDrafts || id.startsWith("published/")) && !ids.has(id))
    throw new Error(`Audited post is missing: ${id}`);
}
const changes = plan.filter(({ changed }) => changed);
console.log(
  JSON.stringify(
    {
      mode: flags.includes("--write") ? "apply" : "preview",
      reviewed: plan.length,
      changed: changes.length,
      unpublishedDraftsIncluded: includeDrafts,
      reviewFlags: [...decisions.values()]
        .filter((d) => ids.has(d.id) && d.needsReview)
        .map((d) => d.id),
    },
    null,
    2
  )
);
if (flags.includes("--write"))
  for (const entry of changes)
    writeMarkdownFile(entry.file, entry.data, entry.content, {
      preserveBody: true,
    });
