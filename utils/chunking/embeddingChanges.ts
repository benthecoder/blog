import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { getPostPath, isSafeSlug } from "@/config/paths";

/** Read a complete push range, including deleted and renamed published posts. */
export function getEmbeddingChanges(base: string) {
  if (!/^[a-f0-9]{40}$/i.test(base) || /^0+$/.test(base)) {
    throw new Error("Embedding sync requires a valid base commit SHA");
  }
  const paths = execFileSync(
    "git",
    ["diff", "--name-only", "--no-renames", "-z", base, "HEAD", "--", "posts/"],
    { encoding: "utf8", cwd: process.cwd() }
  ).split("\0");
  const updated: string[] = [];
  const deleted: string[] = [];
  for (const file of paths) {
    if (!file.startsWith("posts/") || !file.endsWith(".md")) continue;
    const slug = file.slice("posts/".length, -".md".length);
    if (!isSafeSlug(slug)) continue;
    (fs.existsSync(getPostPath(slug)) ? updated : deleted).push(slug);
  }
  return { updated, deleted };
}
