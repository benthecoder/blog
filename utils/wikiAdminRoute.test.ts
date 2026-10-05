import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/utils/content/wikiAdmin", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/utils/content/wikiAdmin")>();
  return { ...original, saveWikiEditorPage: vi.fn() };
});
import { POST } from "@/app/api/admin/wiki/route";
import { revalidatePath } from "next/cache";
import { saveWikiEditorPage, WikiEditError } from "@/utils/content/wikiAdmin";

function request(headers: Record<string, string> = {}, body = "{}") {
  return new NextRequest("http://localhost:3000/api/admin/wiki", {
    method: "POST",
    headers: {
      origin: "http://localhost:3000",
      "content-type": "application/json",
      ...headers,
    },
    body,
  });
}
beforeEach(() => {
  vi.stubEnv("NODE_ENV", "development");
  vi.clearAllMocks();
});
afterEach(() => {
  vi.unstubAllEnvs();
});

describe("wiki save endpoint", () => {
  it("disables file authoring in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    expect((await POST(request())).status).toBe(404);
    expect(saveWikiEditorPage).not.toHaveBeenCalled();
  });
  it.each(["https://hostile.example", ""])(
    "rejects origin %j",
    async (origin) => {
      expect((await POST(request({ origin }))).status).toBe(403);
      expect(saveWikiEditorPage).not.toHaveBeenCalled();
    }
  );
  it("requires JSON and rejects malformed bodies", async () => {
    expect((await POST(request({ "content-type": "text/plain" }))).status).toBe(
      415
    );
    expect((await POST(request({}, "{"))).status).toBe(400);
    expect(saveWikiEditorPage).not.toHaveBeenCalled();
  });
  it("returns the saved page and invalidates wiki views", async () => {
    vi.mocked(saveWikiEditorPage).mockReturnValue({
      slug: "faith",
      title: "Faith",
      category: "religion",
      tags: [],
      description: "",
      lastUpdated: "",
      content: "Notes",
      version: "version",
    });
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect((await response.json()).page.slug).toBe("faith");
    expect(revalidatePath).toHaveBeenCalledWith("/admin/wiki");
    expect(revalidatePath).toHaveBeenCalledWith("/wiki/[slug]", "page");
    expect(revalidatePath).toHaveBeenCalledWith("/posts/[slug]", "page");
  });
  it("returns conflict errors without invalidating views", async () => {
    vi.mocked(saveWikiEditorPage).mockImplementation(() => {
      throw new WikiEditError("Stale edit", 409);
    });
    const response = await POST(request());
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "Stale edit" });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
