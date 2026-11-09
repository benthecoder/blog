import fs from "node:fs";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { DELETE } from "@/app/api/admin/delete-post/route";
import { getDraftPath, getPostPath, IMAGES_DRAFTS_DIR } from "@/config/paths";
vi.mock("@/utils/adminAuth", () => ({ checkAdminAuth: () => null }));
vi.mock("@/utils/content/markdown", () => ({
  readMarkdownFile: () => ({
    data: { date: "Mar 16, 2026" },
    content: "writing",
  }),
}));
let files: Set<string>;
beforeEach(() => {
  files = new Set();
  vi.spyOn(fs, "existsSync").mockImplementation((file) =>
    files.has(String(file))
  );
  vi.spyOn(fs, "unlinkSync").mockImplementation((file) => {
    files.delete(String(file));
  });
});
afterEach(() => vi.restoreAllMocks());
const request = () =>
  new NextRequest("http://localhost/api/admin/delete-post?slug=160326");
it("deletes the draft and returns the next day's draft", async () => {
  files.add(getDraftPath("160326"));
  files.add(getDraftPath("170326"));
  const response = await DELETE(request());
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({
    deletedFrom: "drafts",
    nextHref: "/admin/edit/170326?month=2026-03",
  });
  expect(files.has(getDraftPath("160326"))).toBe(false);
});
it("opens the next published day when it already exists", async () => {
  files.add(getPostPath("160326"));
  files.add(getPostPath("170326"));
  expect(await (await DELETE(request())).json()).toMatchObject({
    deletedFrom: "published",
    nextHref: "/admin/edit/170326?month=2026-03",
  });
});
it("opens a blank next day instead of returning to a missing post", async () => {
  files.add(getDraftPath("160326"));
  expect(await (await DELETE(request())).json()).toMatchObject({
    nextHref: "/admin/edit/new?date=2026-03-17&month=2026-03",
  });
});
it("still advances if optional image cleanup fails after the post is deleted", async () => {
  files.add(getDraftPath("160326"));
  files.add(IMAGES_DRAFTS_DIR);
  vi.spyOn(fs, "readdirSync").mockReturnValue(["160326-photo.jpg"] as never);
  vi.mocked(fs.unlinkSync).mockImplementation((file) => {
    if (String(file).endsWith(".jpg")) throw Error("cleanup failed");
    files.delete(String(file));
  });
  vi.spyOn(console, "error").mockImplementation(() => {});
  const response = await DELETE(request());
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({
    success: true,
    nextHref: "/admin/edit/new?date=2026-03-17&month=2026-03",
  });
});
