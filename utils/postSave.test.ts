import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { readMarkdownFile } from "./content/markdown";

const state = vi.hoisted(() => ({ root: "", auth: vi.fn() }));
vi.mock("@/utils/adminAuth", () => ({ checkAdminAuth: state.auth }));
vi.mock("@/config/paths", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/config/paths")>()),
  getPostPath: (slug: string) => path.join(state.root, `${slug}.md`),
  getDraftPath: (slug: string) => path.join(state.root, "drafts", `${slug}.md`),
}));
import { POST } from "@/app/api/admin/save-post/route";

const payload = {
  slug: "010126",
  title: "a title",
  tags: "journal, notes",
  date: "Jan 1, 2026",
  content: "\nmy writing\n",
  isNew: true,
};
const published = () => path.join(state.root, `${payload.slug}.md`);
const draft = () => path.join(state.root, "drafts", `${payload.slug}.md`);
const request = (body: unknown) =>
  new NextRequest("http://localhost/api/admin/save-post", {
    method: "POST",
    body: JSON.stringify(body),
  });
beforeEach(() => {
  state.root = fs.mkdtempSync(path.join(os.tmpdir(), "post-save-"));
  fs.mkdirSync(path.join(state.root, "drafts"));
  state.auth.mockReset().mockReturnValue(null);
});
afterEach(() => fs.rmSync(state.root, { recursive: true, force: true }));

it("rejects malformed or wrongly typed input without changing an existing post", async () => {
  fs.writeFileSync(published(), "original post bytes");
  const invalid = [
    null,
    [],
    5,
    {},
    { ...payload, slug: "../outside" },
    { ...payload, slug: 123 },
    { ...payload, title: { nested: "wrong" } },
    { ...payload, tags: { nested: "wrong" } },
    { ...payload, tags: ["ok", 123] },
    { ...payload, date: ["2026-01-01"] },
    { ...payload, content: undefined },
    { ...payload, content: ["wrong"] },
    { ...payload, isNew: "false" },
  ];
  for (const body of invalid)
    expect((await POST(request(body))).status).toBe(400);
  expect(
    (
      await POST(
        new NextRequest("http://localhost/api/admin/save-post", {
          method: "POST",
          body: "{",
        })
      )
    ).status
  ).toBe(400);
  expect(fs.readFileSync(published(), "utf8")).toBe("original post bytes");
  expect(fs.readdirSync(path.dirname(draft()))).toEqual([]);
});

it("preserves valid draft creation, collision protection and published edits", async () => {
  expect((await POST(request(payload))).status).toBe(200);
  expect(readMarkdownFile(draft())).toEqual({
    data: { title: payload.title, tags: payload.tags, date: payload.date },
    content: payload.content,
  });
  const original = fs.readFileSync(draft(), "utf8");
  expect(
    (await POST(request({ ...payload, content: "overwrite" }))).status
  ).toBe(409);
  expect(fs.readFileSync(draft(), "utf8")).toBe(original);
  fs.renameSync(draft(), published());
  expect(
    (
      await POST(
        request({
          ...payload,
          isNew: false,
          tags: ["journal", "notes"],
          content: "edited",
        })
      )
    ).status
  ).toBe(200);
  expect(readMarkdownFile(published())).toEqual({
    data: {
      title: payload.title,
      tags: ["journal", "notes"],
      date: payload.date,
    },
    content: "edited\n",
  });
  expect(fs.existsSync(draft())).toBe(false);
});

it("checks authentication before reading or writing request content", async () => {
  state.auth.mockReturnValue(
    NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  );
  const input = request(payload);
  const read = vi.spyOn(input, "json");
  expect((await POST(input)).status).toBe(401);
  expect(read).not.toHaveBeenCalled();
  expect(fs.existsSync(draft())).toBe(false);
});
