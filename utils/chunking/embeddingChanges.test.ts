import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

let directory: string;
const git = (...args: string[]) =>
  execFileSync("git", args, { cwd: directory, encoding: "utf8" }).trim();
const write = (file: string, content: string) => {
  const target = path.join(directory, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
};
const commit = () => {
  git("add", ".");
  git("commit", "-qm", "fixture");
  return git("rev-parse", "HEAD");
};
beforeEach(() => {
  vi.resetModules();
  directory = fs.mkdtempSync(path.join(os.tmpdir(), "embedding-changes-"));
  git("init", "-q");
  git("config", "user.email", "fixture@example.com");
  git("config", "user.name", "Fixture");
  vi.spyOn(process, "cwd").mockReturnValue(directory);
});
afterEach(() => {
  vi.restoreAllMocks();
  fs.rmSync(directory, { recursive: true, force: true });
});

it("covers every commit since the successful baseline, excluding drafts and unrelated files", async () => {
  write("posts/original.md", "Before");
  const base = commit();
  write("posts/first.md", "First skipped push");
  commit();
  write("posts/original.md", "After");
  write("posts/日本語 with spaces.md", "Latest push");
  write("posts/drafts/private.md", "Draft");
  write("wiki/note.md", "Wiki");
  write("posts/asset.png", "Image");
  commit();
  const { getEmbeddingChanges } = await import("./embeddingChanges");
  expect(getEmbeddingChanges(base)).toEqual({
    updated: ["first", "original", "日本語 with spaces"],
    deleted: [],
  });
});

it("treats a rename as removal of the old slug and indexing of the new slug", async () => {
  write("posts/old.md", "Content");
  const base = commit();
  fs.renameSync(
    path.join(directory, "posts/old.md"),
    path.join(directory, "posts/new.md")
  );
  commit();
  const { getEmbeddingChanges } = await import("./embeddingChanges");
  expect(getEmbeddingChanges(base)).toEqual({
    updated: ["new"],
    deleted: ["old"],
  });
});

it("handles deletion and draft promotion without trying to read the missing post", async () => {
  write("posts/remove.md", "Remove me");
  write("posts/drafts/promote.md", "Promote me");
  const base = commit();
  fs.unlinkSync(path.join(directory, "posts/remove.md"));
  fs.renameSync(
    path.join(directory, "posts/drafts/promote.md"),
    path.join(directory, "posts/promote.md")
  );
  commit();
  const { getEmbeddingChanges } = await import("./embeddingChanges");
  expect(getEmbeddingChanges(base)).toEqual({
    updated: ["promote"],
    deleted: ["remove"],
  });
  expect(getEmbeddingChanges(git("rev-parse", "HEAD"))).toEqual({
    updated: [],
    deleted: [],
  });
});

it.each(["", "0".repeat(40), "--output=outside", "HEAD"])(
  "rejects invalid baseline %j",
  async (base) => {
    const { getEmbeddingChanges } = await import("./embeddingChanges");
    expect(() => getEmbeddingChanges(base)).toThrow("valid base commit SHA");
  }
);
