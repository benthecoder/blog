import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/admin/save-post/route";
import { writeMarkdownFile } from "@/utils/content/markdown";
import { GET } from "@/app/api/admin/get-post/route";
import { getDraftPath, getPostPath } from "@/config/paths";
import { readMarkdownFile } from "@/utils/content/markdown";

vi.mock("@/utils/content/markdown", () => ({
  readMarkdownFile: vi.fn(),
  writeMarkdownFile: vi.fn(),
}));
beforeEach(() => {
  vi.stubEnv("NODE_ENV", "development");
  vi.clearAllMocks();
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});
const request = () =>
  new NextRequest("http://localhost:3000/api/admin/get-post?slug=270725");

describe("opening a saved draft", () => {
  it("opens the combined draft when the original published post also exists", async () => {
    vi.spyOn(fs, "existsSync").mockImplementation((file) =>
      [getDraftPath("270725"), getPostPath("270725")].includes(String(file))
    );
    vi.mocked(readMarkdownFile).mockReturnValue({
      data: { title: "Original title", date: "July 27, 2025" },
      content: "Original writing\n\n## sunday links\n\nSaved links",
    });
    const response = await GET(request());
    expect(readMarkdownFile).toHaveBeenCalledWith(
      getDraftPath("270725"),
      expect.anything()
    );
    expect(await response.json()).toMatchObject({
      isDraft: true,
      content: expect.stringContaining("Original writing\n\n## sunday links"),
    });
  });
  it("falls back to the published post when there is no pending draft", async () => {
    vi.spyOn(fs, "existsSync").mockImplementation(
      (file) => String(file) === getPostPath("270725")
    );
    vi.mocked(readMarkdownFile).mockReturnValue({
      data: { title: "Published" },
      content: "Published text",
    });
    expect(await (await GET(request())).json()).toMatchObject({
      isDraft: false,
      content: "Published text",
    });
  });
  it("returns 404 when neither version exists", async () => {
    vi.spyOn(fs, "existsSync").mockReturnValue(false);
    expect((await GET(request())).status).toBe(404);
  });
});

const saveRequest = (format?: string) =>
  new NextRequest("http://localhost:3000/api/admin/save-post", {
    method: "POST",
    body: JSON.stringify({
      slug: "270725",
      title: "Edited title",
      tags: "nature",
      date: "July 27, 2025",
      content: "Edited body",
      ...(format === undefined ? {} : { format }),
    }),
  });
describe("saving post format", () => {
  beforeEach(() => {
    vi.spyOn(fs, "existsSync").mockReturnValue(true);
    vi.mocked(readMarkdownFile).mockReturnValue({
      data: {
        title: "Original",
        date: "July 27, 2025",
        format: "links",
        locations: ["Taiwan"],
      },
      content: "Original body",
    });
  });
  it("returns the stored format when opening a post", async () => {
    expect(await (await GET(request())).json()).toMatchObject({
      format: "links",
    });
  });
  it("updates format on the pending draft, preserving other metadata and the public original", async () => {
    expect((await POST(saveRequest("essay"))).status).toBe(200);
    expect(writeMarkdownFile).toHaveBeenCalledWith(
      getDraftPath("270725"),
      expect.objectContaining({
        format: "essay",
        locations: ["Taiwan"],
        title: "Edited title",
      }),
      "Edited body",
      expect.anything()
    );
    expect(writeMarkdownFile).toHaveBeenCalledTimes(1);
  });
  it("preserves format when an older client omits it", async () => {
    await POST(saveRequest());
    expect(writeMarkdownFile).toHaveBeenCalledWith(
      getDraftPath("270725"),
      expect.objectContaining({ format: "links" }),
      "Edited body",
      expect.anything()
    );
  });
  it("rejects unknown formats without writing", async () => {
    expect((await POST(saveRequest("banana"))).status).toBe(400);
    expect(writeMarkdownFile).not.toHaveBeenCalled();
  });
  it("refuses to write a date the site build would reject", async () => {
    const response = await POST(
      new NextRequest("http://localhost:3000/api/admin/save-post", {
        method: "POST",
        body: JSON.stringify({
          slug: "270725",
          title: "Edited title",
          tags: "nature",
          date: "someday",
          content: "Edited body",
        }),
      })
    );
    expect(response.status).toBe(400);
    expect((await response.json()).error).toMatch(/^date: not a date/);
    expect(writeMarkdownFile).not.toHaveBeenCalled();
  });
});
