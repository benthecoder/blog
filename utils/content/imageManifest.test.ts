import { describe, expect, it } from "vitest";
import { POSTS_DIR } from "@/config/paths";
import { getImageMeta } from "./imageMeta";
import { scanMarkdownDir } from "./markdown";
import { postFrontmatterSchema } from "./schemas";

// Without a manifest entry, a photo ships with no size: its print has no
// shape until the phone reports one, and no blur placeholder. If this
// fails, run `pnpm generate:image-meta` and commit the manifest.
//
// Known gaps: the file was never uploaded to R2, so it 404s. Remove the
// entry once the image is uploaded and the manifest regenerated.
const NOT_IN_R2 = ["031225: /images/journey-spotify.jpg"];

describe("image manifest", () => {
  it("knows the size of every photo in a published post", () => {
    const missing = scanMarkdownDir(POSTS_DIR, postFrontmatterSchema).flatMap(
      ({ slug, content }) =>
        [...content.matchAll(/!\[[^\]]*\]\((\/images\/[^)/\s]+)\)/g)]
          .map((match) => match[1])
          .filter((src) => !getImageMeta(src))
          .map((src) => `${slug}: ${src}`)
    );
    expect(missing).toEqual(NOT_IN_R2);
  });
});
