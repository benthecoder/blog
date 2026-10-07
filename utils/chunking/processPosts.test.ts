import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

const archive = vi.hoisted(() => ({ scan: vi.fn() }));
vi.mock("../content/posts", () => ({ getAllPosts: archive.scan }));

let directory: string;
beforeEach(() => {
  vi.resetModules();
  directory = fs.mkdtempSync(path.join(os.tmpdir(), "embedding-post-"));
  fs.mkdirSync(path.join(directory, "posts"));
  vi.spyOn(process, "cwd").mockReturnValue(directory);
  archive.scan.mockReset().mockImplementation(() => {
    throw new Error("Single-post mode must not scan the archive");
  });
});
afterEach(() => {
  vi.restoreAllMocks();
  fs.rmSync(directory, { recursive: true, force: true });
});

it("reads just the selected post and canonicalizes an optional .md suffix", async () => {
  const filePath = path.join(directory, "posts", "selected.md");
  fs.writeFileSync(
    filePath,
    "---\ntitle: Selected\n---\nA paragraph worth indexing."
  );
  fs.writeFileSync(path.join(directory, "posts", "unrelated.md"), "Other post");
  const { processPost } = await import("./processPosts");
  const read = vi.spyOn(fs, "readFileSync");
  const first = await processPost("selected");
  expect(first.filePath).toBe("selected");
  expect(first.chunks.length).toBeGreaterThan(0);
  expect(read).toHaveBeenCalledTimes(1);
  expect(read).toHaveBeenCalledWith(filePath, "utf8");
  expect(await processPost("selected.md")).toEqual(first);
  expect(archive.scan).not.toHaveBeenCalled();
});

it.each(["../outside", "drafts/post", "", ".md"])(
  "rejects invalid slug %j before reading content",
  async (slug) => {
    const { processPost } = await import("./processPosts");
    const read = vi.spyOn(fs, "readFileSync");
    await expect(processPost(slug)).rejects.toThrow("Invalid slug");
    expect(read).not.toHaveBeenCalled();
  }
);

it("rejects missing content before index replacement", async () => {
  const { processPost } = await import("./processPosts");
  await expect(processPost("missing")).rejects.toThrow("not found");
});

it("rejects an empty post before index replacement", async () => {
  fs.writeFileSync(path.join(directory, "posts", "empty.md"), "");
  const { processPost } = await import("./processPosts");
  await expect(processPost("empty")).rejects.toThrow(
    "existing index preserved"
  );
});

it("rejects unreadable content before index replacement", async () => {
  fs.mkdirSync(path.join(directory, "posts", "directory.md"));
  const { processPost } = await import("./processPosts");
  vi.spyOn(console, "error").mockImplementation(() => {});
  await expect(processPost("directory")).rejects.toThrow(
    "existing index preserved"
  );
});
