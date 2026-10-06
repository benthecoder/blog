import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const { sql } = vi.hoisted(() => ({ sql: vi.fn() }));
vi.mock("@neondatabase/serverless", () => ({ neon: () => sql }));
import { POST } from "../app/api/tweet/route";
import { sessionToken } from "./adminAuth";

function request(
  body: unknown,
  headers: Record<string, string | undefined> = {}
) {
  const checkedHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };
  for (const [key, value] of Object.entries(headers))
    if (value !== undefined) checkedHeaders[key] = value;
  return new NextRequest("https://bneo.xyz/api/tweet", {
    method: "POST",
    headers: checkedHeaders,
    body: JSON.stringify(body),
  });
}
beforeEach(() => {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("CAPTURE_SECRET", "test-capture-secret");
  vi.stubEnv("ADMIN_SECRET", "test-admin-secret");
  sql.mockReset().mockResolvedValue([{ id: 1 }]);
});
afterEach(() => vi.unstubAllEnvs());

describe("capture route authorization", () => {
  it.each([
    {},
    { authorization: "Bearer wrong" },
    { authorization: "Bearer test-admin-secret" },
  ])(
    "rejects unauthorized writes before touching the database",
    async (headers) => {
      expect((await POST(request({ body: "test" }, headers))).status).toBe(401);
      expect(sql).not.toHaveBeenCalled();
    }
  );
  it("fails closed when no production credentials are configured", async () => {
    vi.stubEnv("CAPTURE_SECRET", "");
    vi.stubEnv("ADMIN_SECRET", "");
    expect((await POST(request({ body: "test" }))).status).toBe(401);
    expect(sql).not.toHaveBeenCalled();
  });
  it("accepts a capture token and preserves link/title without fetching it", async () => {
    const res = await POST(
      request(
        { body: "my take", link: "https://example.com", title: "  A   title " },
        { authorization: "Bearer test-capture-secret" }
      )
    );
    expect(res.status).toBe(200);
    expect(sql).toHaveBeenCalledOnce();
    expect(sql.mock.calls[0].slice(1)).toEqual([
      "my take",
      "https://example.com/",
      "A title",
    ]);
  });
  it("accepts the existing owner's admin session", async () => {
    const res = await POST(
      request(
        { body: "test" },
        { cookie: `admin_session=${sessionToken("test-admin-secret")}` }
      )
    );
    expect(res.status).toBe(200);
  });
  it("rejects foreign-origin writes even with credentials", async () => {
    const res = await POST(
      request(
        { body: "test" },
        {
          authorization: "Bearer test-capture-secret",
          origin: "https://other.example",
        }
      )
    );
    expect(res.status).toBe(403);
    expect(sql).not.toHaveBeenCalled();
  });
  it("keeps local authoring available", async () => {
    vi.stubEnv("NODE_ENV", "development");
    expect((await POST(request({ body: "test" }))).status).toBe(200);
  });
  it.each([
    null,
    [],
    { body: 123 },
    { link: {} },
    { title: false },
    { body: " " },
  ])("rejects invalid input without writing", async (body) => {
    const res = await POST(
      request(body, { authorization: "Bearer test-capture-secret" })
    );
    expect(res.status).toBe(400);
    expect(sql).not.toHaveBeenCalled();
  });
  it("handles malformed JSON without writing", async () => {
    const res = await POST(
      new NextRequest("https://bneo.xyz/api/tweet", {
        method: "POST",
        headers: { authorization: "Bearer test-capture-secret" },
        body: "{",
      })
    );
    expect(res.status).toBe(400);
    expect(sql).not.toHaveBeenCalled();
  });
});
