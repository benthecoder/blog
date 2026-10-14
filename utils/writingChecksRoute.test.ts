import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import type { LinkableEntry } from "@/types/links";

const mocks = vi.hoisted(() => ({ index: vi.fn() }));
vi.mock("@/utils/content/links", () => ({ getLinkIndex: mocks.index }));
import { POST } from "@/app/api/admin/writing-checks/route";

function request(
  body: unknown = { content: "[[Missing]]", title: "My page", slug: "my-page" },
  headers: Record<string, string> = {}
) {
  return new NextRequest("http://localhost:3414/api/admin/writing-checks", {
    method: "POST",
    headers: {
      origin: "http://localhost:3414",
      "content-type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}
beforeEach(() => {
  vi.stubEnv("NODE_ENV", "development");
  mocks.index.mockReset().mockReturnValue({ entries: [] });
});
afterEach(() => vi.unstubAllEnvs());
describe("local writing check endpoint", () => {
  it("does not read the index in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    expect((await POST(request())).status).toBe(404);
    expect(mocks.index).not.toHaveBeenCalled();
  });
  it.each(["", "https://elsewhere.example"])(
    "requires the local origin: %s",
    async (origin) => {
      expect((await POST(request(undefined, { origin }))).status).toBe(403);
      expect(mocks.index).not.toHaveBeenCalled();
    }
  );
  it("requires JSON", async () => {
    expect(
      (await POST(request(undefined, { "content-type": "text/plain" }))).status
    ).toBe(415);
    expect(mocks.index).not.toHaveBeenCalled();
  });
  it.each([
    null,
    [],
    {},
    { content: "text", title: 5, slug: "my-page" },
    { content: "x".repeat(2_000_001), title: "Title", slug: "my-page" },
  ])("rejects malformed fields", async (body) => {
    expect((await POST(request(body))).status).toBe(400);
    expect(mocks.index).not.toHaveBeenCalled();
  });
  it("uses the current index on each check", async () => {
    expect((await (await POST(request())).json()).total).toBe(1);
    const entry: LinkableEntry = {
      ref: { kind: "wiki", slug: "missing" },
      title: "Missing",
      href: "/wiki/missing",
    };
    mocks.index.mockReturnValue({ entries: [entry] });
    expect(await (await POST(request())).json()).toEqual({
      total: 0,
      checks: [],
    });
    expect(mocks.index).toHaveBeenCalledTimes(2);
  });
  it("resolves the current unsaved page's own title", async () => {
    expect(
      await (
        await POST(
          request({ content: "[[My page]]", title: "My page", slug: "my-page" })
        )
      ).json()
    ).toEqual({ total: 0, checks: [] });
  });
  it("caps displayed checks while reporting the full count", async () => {
    const content = Array(60).fill("[[Missing]]").join("\n\n");
    const response = await POST(request({ content, title: "", slug: "" }));
    const data = await response.json();
    expect(data.total).toBe(60);
    expect(data.checks).toHaveLength(50);
  });
});
