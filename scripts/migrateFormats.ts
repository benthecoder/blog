// Preview: pnpm migrate:formats. Apply locally: pnpm migrate:formats --write.
import path from "node:path";
import { POSTS_DIR, DRAFTS_DIR } from "@/config/paths";
import { scanMarkdownDir, writeMarkdownFile } from "@/utils/content/markdown";
import { migrateFormat, ESSAY_SLUGS } from "@/utils/content/formatMigration";

const args = process.argv.slice(2);
if (args.some((arg) => arg !== "--write")) {
  throw new Error("usage: pnpm migrate:formats [--write]");
}
const write = args.includes("--write");
// Plan and validate every change before writing any file. Include local drafts
// when present, but never publish them or change their slugs, dates, or bodies.
const plan = [POSTS_DIR, DRAFTS_DIR].flatMap((dir) =>
  scanMarkdownDir(dir).map(({ slug, data, content }) => ({
    file: path.join(dir, `${slug}.md`),
    slug,
    title: data.title,
    content,
    ...migrateFormat(slug, data),
  }))
);
const changes = plan.filter(({ changed }) => changed);
console.log(write ? "Applying formats" : "Preview only — no files changed");
for (const entry of changes) {
  console.log(
    `${path.relative(process.cwd(), entry.file)}: ${entry.title} → ${entry.format ?? "post"}; remove [${entry.removed.join(", ")}]`
  );
  if (write)
    writeMarkdownFile(entry.file, entry.data, entry.content, {
      preserveBody: true,
    });
}
const counts: Record<string, number> = {};
for (const { format } of plan)
  counts[format ?? "post"] = (counts[format ?? "post"] ?? 0) + 1;
console.log(
  JSON.stringify(
    { changed: changes.length, total: plan.length, formats: counts },
    null,
    2
  )
);
for (const slug of ESSAY_SLUGS) {
  if (!plan.some((entry) => entry.slug === slug))
    console.warn(`Missing essay: ${slug}`);
}
if (!write)
  console.log(
    "Review the preview, then run pnpm migrate:formats --write to apply."
  );
