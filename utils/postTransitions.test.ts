import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  root: "",
  put: vi.fn(),
  list: vi.fn(),
  get: vi.fn(),
  remove: vi.fn(),
  auth: vi.fn(),
}));
vi.mock("@/utils/r2", () => ({
  r2PutImage: mocks.put,
  r2ListImages: mocks.list,
  r2GetImage: mocks.get,
  r2DeleteImage: mocks.remove,
}));
vi.mock("@/utils/adminAuth", () => ({ checkAdminAuth: mocks.auth }));
vi.mock("@/config/paths", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/config/paths")>();
  return {
    ...actual,
    get IMAGES_DRAFTS_DIR() {
      return path.join(mocks.root, "images/drafts");
    },
    getPostPath: (slug: string) => path.join(mocks.root, "posts", `${slug}.md`),
    getDraftPath: (slug: string) =>
      path.join(mocks.root, "posts/drafts", `${slug}.md`),
  };
});
const slug = "010126";
const photos = [`${slug}-one.jpg`, `${slug}-two.jpg`];
const draftText = `---\ntitle: 'untouched formatting'\n---\n\n![photo](/images/drafts/${photos[0]})\n`;
const publishedText = draftText.replace("/images/drafts/", "/images/");
const published = () => path.join(mocks.root, "posts", `${slug}.md`);
const draft = () => path.join(mocks.root, "posts/drafts", `${slug}.md`);
const image = (name: string) => path.join(mocks.root, "images/drafts", name);
const request = () =>
  new NextRequest("http://localhost/api/admin/post", {
    method: "POST",
    body: JSON.stringify({ slug }),
  });
async function publish() {
  return (await import("@/app/api/admin/publish-post/route")).POST(request());
}
async function unpublish() {
  return (await import("@/app/api/admin/unpublish-post/route")).POST(request());
}
beforeEach(() => {
  vi.resetModules();
  mocks.root = fs.mkdtempSync(path.join(os.tmpdir(), "post-transitions-"));
  fs.mkdirSync(path.dirname(draft()), { recursive: true });
  fs.mkdirSync(path.dirname(image(photos[0])), { recursive: true });
  mocks.auth.mockReset().mockReturnValue(null);
  mocks.put.mockReset().mockResolvedValue(undefined);
  mocks.list.mockReset().mockResolvedValue(photos);
  mocks.get
    .mockReset()
    .mockImplementation(async (name: string) => Buffer.from(name));
  mocks.remove.mockReset().mockResolvedValue(undefined);
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
  fs.rmSync(mocks.root, { recursive: true, force: true });
});
function prepareDraft() {
  fs.writeFileSync(draft(), draftText);
  for (const name of photos) fs.writeFileSync(image(name), name);
}
function preparePublished() {
  fs.writeFileSync(published(), publishedText);
}

describe("publish transaction boundaries", () => {
  it("keeps the draft and photos until every upload succeeds", async () => {
    prepareDraft();
    mocks.put.mockImplementation(async () => {
      expect(fs.readFileSync(draft(), "utf8")).toBe(draftText);
      expect(fs.existsSync(published())).toBe(false);
      expect(photos.every((name) => fs.existsSync(image(name)))).toBe(true);
    });
    expect((await publish()).status).toBe(200);
    expect(fs.readFileSync(published(), "utf8")).toBe(publishedText);
    expect(fs.existsSync(draft())).toBe(false);
    expect(photos.some((name) => fs.existsSync(image(name)))).toBe(false);
  });
  it("preserves all local originals if the second upload fails", async () => {
    prepareDraft();
    mocks.put
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("upload failed"));
    expect((await publish()).status).toBe(500);
    expect(fs.readFileSync(draft(), "utf8")).toBe(draftText);
    expect(fs.existsSync(published())).toBe(false);
    for (const name of photos)
      expect(fs.readFileSync(image(name), "utf8")).toBe(name);
  });
  it("never overwrites a post created while uploads are in flight", async () => {
    prepareDraft();
    mocks.put.mockImplementationOnce(async () =>
      fs.writeFileSync(published(), "other post")
    );
    expect((await publish()).status).toBe(409);
    expect(fs.readFileSync(published(), "utf8")).toBe("other post");
    expect(fs.readFileSync(draft(), "utf8")).toBe(draftText);
    expect(photos.every((name) => fs.existsSync(image(name)))).toBe(true);
  });
  it("does not delete an edited draft after uploading its old assets", async () => {
    prepareDraft();
    mocks.put.mockImplementationOnce(async () =>
      fs.writeFileSync(draft(), "edited draft")
    );
    expect((await publish()).status).toBe(409);
    expect(fs.readFileSync(draft(), "utf8")).toBe("edited draft");
    expect(fs.existsSync(published())).toBe(false);
  });
});

describe("unpublish transaction boundaries", () => {
  it("stages all photos before removing any published data", async () => {
    preparePublished();
    mocks.get.mockImplementation(async (name: string) => {
      expect(fs.readFileSync(published(), "utf8")).toBe(publishedText);
      expect(fs.existsSync(draft())).toBe(false);
      expect(mocks.remove).not.toHaveBeenCalled();
      return Buffer.from(name);
    });
    mocks.remove.mockImplementation(async () => {
      expect(fs.existsSync(published())).toBe(false);
      expect(fs.readFileSync(draft(), "utf8")).toBe(draftText);
      for (const name of photos)
        expect(fs.readFileSync(image(name), "utf8")).toBe(name);
    });
    expect((await unpublish()).status).toBe(200);
    expect(mocks.remove).toHaveBeenCalledTimes(2);
    expect(fs.readdirSync(path.dirname(image(photos[0]))).sort()).toEqual(
      photos
    );
  });
  it("preserves the post and remote assets if the second download fails", async () => {
    preparePublished();
    mocks.get
      .mockResolvedValueOnce(Buffer.from("first"))
      .mockRejectedValueOnce(new Error("download failed"));
    expect((await unpublish()).status).toBe(500);
    expect(fs.readFileSync(published(), "utf8")).toBe(publishedText);
    expect(fs.existsSync(draft())).toBe(false);
    expect(mocks.remove).not.toHaveBeenCalled();
    expect(fs.readdirSync(path.dirname(image(photos[0])))).toEqual([]);
  });
  it("never overwrites an existing draft", async () => {
    preparePublished();
    fs.writeFileSync(draft(), "existing draft");
    expect((await unpublish()).status).toBe(409);
    expect(fs.readFileSync(draft(), "utf8")).toBe("existing draft");
    expect(fs.readFileSync(published(), "utf8")).toBe(publishedText);
    expect(mocks.list).not.toHaveBeenCalled();
  });
  it("rolls back newly staged photos on a local photo collision", async () => {
    preparePublished();
    fs.writeFileSync(image(photos[1]), "different local photo");
    expect((await unpublish()).status).toBe(409);
    expect(fs.readFileSync(image(photos[1]), "utf8")).toBe(
      "different local photo"
    );
    expect(fs.existsSync(image(photos[0]))).toBe(false);
    expect(fs.existsSync(draft())).toBe(false);
    expect(fs.existsSync(published())).toBe(true);
    expect(mocks.remove).not.toHaveBeenCalled();
  });
  it("retains complete local copies if remote deletion fails after committing", async () => {
    preparePublished();
    mocks.remove.mockRejectedValueOnce(new Error("remote deletion failed"));
    expect((await unpublish()).status).toBe(500);
    expect(fs.readFileSync(draft(), "utf8")).toBe(draftText);
    for (const name of photos)
      expect(fs.readFileSync(image(name), "utf8")).toBe(name);
  });
  it("rejects nested remote keys before writing outside the image directory", async () => {
    preparePublished();
    mocks.list.mockResolvedValue([`${slug}-../../outside.jpg`]);
    expect((await unpublish()).status).toBe(500);
    expect(mocks.get).not.toHaveBeenCalled();
    expect(fs.existsSync(published())).toBe(true);
  });
  it("rejects publishing while remote unpublish cleanup is pending", async () => {
    preparePublished();
    let complete!: () => void;
    const stalled = new Promise<void>((resolve) => {
      complete = resolve;
    });
    mocks.remove.mockImplementationOnce(() => stalled);
    const operation = unpublish();
    await vi.waitFor(() => expect(mocks.remove).toHaveBeenCalledTimes(1));
    // A separately loaded route must see the same process-wide guard.
    vi.resetModules();
    expect((await publish()).status).toBe(409);
    expect(mocks.put).not.toHaveBeenCalled();
    complete();
    expect((await operation).status).toBe(200);
    expect((await publish()).status).toBe(200);
  });

  it("releases the transition guard after a failed download", async () => {
    preparePublished();
    mocks.get.mockRejectedValueOnce(new Error("failed"));
    expect((await unpublish()).status).toBe(500);
    expect((await unpublish()).status).toBe(200);
  });

  it("does not overwrite a draft created during downloads", async () => {
    preparePublished();
    mocks.get.mockImplementationOnce(async (name: string) => {
      fs.writeFileSync(draft(), "concurrent draft");
      return Buffer.from(name);
    });
    expect((await unpublish()).status).toBe(409);
    expect(fs.readFileSync(draft(), "utf8")).toBe("concurrent draft");
    expect(fs.readFileSync(published(), "utf8")).toBe(publishedText);
    expect(fs.readdirSync(path.dirname(image(photos[0])))).toEqual([]);
    expect(mocks.remove).not.toHaveBeenCalled();
  });
});
