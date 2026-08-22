/**
 * Promotes images that are stranded in public/images/drafts/ even though the
 * post that uses them is already published.
 *
 * How they get stranded: uploads always stage into drafts, and publish-post
 * is what promotes them to R2 and rewrites the markdown. Add an image to a
 * post that is *already* published and that step never runs again, so the
 * file stays local and the markdown keeps pointing at /images/drafts/. It
 * resolves in dev (the file is in public/) and 404s in production.
 *
 * The upload route now sends published posts' images straight to R2, so this
 * is a one-off repair for anything uploaded before that fix.
 *
 *   pnpm promote-images          # dry run, prints the plan
 *   pnpm promote-images --apply  # upload to R2, fix markdown, remove local
 */
import fs from "fs";
import path from "path";
import { config } from "dotenv";
import { IMAGES_DRAFTS_DIR, POSTS_DIR, getPostPath } from "@/config/paths";

config();

const apply = process.argv.includes("--apply");

async function main() {
  if (!fs.existsSync(IMAGES_DRAFTS_DIR)) {
    console.log("No drafts image directory — nothing to do.");
    return;
  }

  const draftImages = fs.readdirSync(IMAGES_DRAFTS_DIR);
  const stranded: { file: string; slug: string; postPath: string }[] = [];

  for (const file of draftImages) {
    // Images are named `<slug>-<name>.<ext>`; the slug is the leading segment
    // before the first hyphen for date-style slugs, but named posts contain
    // hyphens too — so match against posts that actually exist instead.
    const candidates = fs
      .readdirSync(POSTS_DIR)
      .filter((p) => p.endsWith(".md"))
      .map((p) => p.replace(/\.md$/, ""))
      .filter((slug) => file.startsWith(`${slug}-`))
      // Longest match wins, so `foo-bar` beats `foo` when both exist.
      .sort((a, b) => b.length - a.length);

    const slug = candidates[0];
    if (slug) stranded.push({ file, slug, postPath: getPostPath(slug) });
  }

  if (stranded.length === 0) {
    console.log("No stranded images — every draft image belongs to a draft.");
    return;
  }

  console.log(
    `${stranded.length} image(s) belong to already-published posts:\n`
  );
  for (const { file, slug } of stranded) {
    console.log(`  ${file}  ->  R2, referenced by posts/${slug}.md`);
  }

  if (!apply) {
    console.log("\nDry run. Re-run with --apply to promote them.");
    return;
  }

  // Imported lazily so a dry run needs no R2 credentials.
  const { r2PutImage } = await import("@/utils/r2");

  for (const { file, slug, postPath } of stranded) {
    const localPath = path.join(IMAGES_DRAFTS_DIR, file);
    await r2PutImage(file, fs.readFileSync(localPath));

    if (fs.existsSync(postPath)) {
      const before = fs.readFileSync(postPath, "utf8");
      const after = before
        .split(`/images/drafts/${file}`)
        .join(`/images/${file}`);
      if (after !== before) fs.writeFileSync(postPath, after, "utf8");
    }

    // Only after the upload and the rewrite have both succeeded.
    fs.unlinkSync(localPath);
    console.log(`  promoted ${file} (posts/${slug}.md updated)`);
  }

  console.log(`\nDone. ${stranded.length} image(s) promoted.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
