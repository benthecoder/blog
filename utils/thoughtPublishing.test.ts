import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { ADMIN_COOKIE, ADMIN_SESSION_SECONDS, sessionToken } from "./adminAuth";

const mocks = vi.hoisted(() => ({
  sql: vi.fn(),
  limit: vi.fn(),
  revalidate: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@neondatabase/serverless", () => ({ neon: () => mocks.sql }));
vi.mock("@/utils/rateLimit", () => ({ checkRateLimit: mocks.limit }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
import { POST } from "@/app/api/tweet/route";
import { POST as login } from "@/app/api/admin/login/route";

const secret = "test-browser-passphrase";
const captureSecret = "test-shortcut-secret";
function request(
  body: unknown = { body: "a thought" },
  headers: HeadersInit = {}
) {
  return new NextRequest("https://example.com/api/tweet", {
    method: "POST",
    body: JSON.stringify(body),
    headers,
  });
}
const cookie = () => ({ Cookie: `${ADMIN_COOKIE}=${sessionToken(secret)}` });
beforeEach(() => {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("ADMIN_SECRET", secret);
  vi.stubEnv("TWEET_SECRET", captureSecret);
  mocks.sql.mockReset().mockResolvedValue([{ id: 1 }]);
  mocks.limit.mockReset().mockResolvedValue({ ok: true, retryAfter: 60 });
  mocks.revalidate.mockReset();
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("thought publishing access", () => {
  it("rejects anonymous requests before inserting or invalidating the stream", async () => {
    expect((await POST(request())).status).toBe(401);
    expect(mocks.sql).not.toHaveBeenCalled();
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
  it("accepts a signed browser session or the separate Shortcut token", async () => {
    expect((await POST(request(undefined, cookie()))).status).toBe(200);
    expect(
      (
        await POST(
          request(undefined, { Authorization: `Bearer ${captureSecret}` })
        )
      ).status
    ).toBe(200);
    expect(mocks.sql).toHaveBeenCalledTimes(2);
  });
  it("rejects expired browser cookies and wrong capture tokens", async () => {
    const expired = sessionToken(
      secret,
      Date.now() - ADMIN_SESSION_SECONDS * 1000
    );
    for (const headers of [
      new Headers({ Cookie: `${ADMIN_COOKIE}=${expired}` }),
      new Headers({ Authorization: "Bearer wrong" }),
    ]) {
      expect((await POST(request(undefined, headers))).status).toBe(401);
    }
    expect(mocks.sql).not.toHaveBeenCalled();
  });
  it("limits publishing before inserts and returns a retry time", async () => {
    mocks.limit.mockResolvedValue({ ok: false, retryAfter: 17 });
    const response = await POST(request(undefined, cookie()));
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("17");
    expect(mocks.limit).toHaveBeenCalledWith(
      expect.objectContaining({ failOpen: false, scope: "thought-publish" })
    );
    expect(mocks.sql).not.toHaveBeenCalled();
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
  it("accepts longer notes with paragraph breaks and a titled link", async () => {
    const note = `${"a".repeat(800)}\n\nwhat I took from this`;
    expect(
      (
        await POST(
          request(
            {
              body: note,
              link: "https://example.com/read",
              title: "An article",
            },
            cookie()
          )
        )
      ).status
    ).toBe(200);
    expect(mocks.sql.mock.calls[0].slice(1)).toEqual([
      note,
      "https://example.com/read",
      "An article",
    ]);
  });
  it.each([
    { body: "x".repeat(5001) },
    { body: "hello", link: "javascript:alert(1)" },
  ])("rejects invalid notes and links without writing", async (body) => {
    expect((await POST(request(body, cookie()))).status).toBe(400);
    expect(mocks.sql).not.toHaveBeenCalled();
  });
});

describe("passphrase sign-in", () => {
  it("limits passphrase attempts before checking credentials", async () => {
    mocks.limit.mockResolvedValue({ ok: false, retryAfter: 35 });
    const response = await login(request({ password: secret }));
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("35");
    expect(response.headers.get("Set-Cookie")).toBeNull();
  });
  it.each([null, {}, { password: 42 }, { password: "x".repeat(1025) }])(
    "handles malformed sign-in input",
    async (body) => {
      expect((await login(request(body))).status).toBe(400);
    }
  );
  it("sets a secure, HttpOnly session and rejects a wrong passphrase", async () => {
    expect((await login(request({ password: "wrong" }))).status).toBe(401);
    const response = await login(request({ password: secret }));
    const header = response.headers.get("Set-Cookie");
    expect(response.status).toBe(200);
    expect(header).toContain("HttpOnly");
    expect(header).toContain("Secure");
    expect(header).toContain("SameSite=lax");
    expect(header).toContain(`Max-Age=${ADMIN_SESSION_SECONDS}`);
    expect(header).not.toContain(secret);
  });
});

it("fails closed with a service error when credential rate limiting is unavailable", async () => {
  mocks.limit.mockResolvedValue({
    ok: false,
    retryAfter: 60,
    reason: "unavailable",
  });
  expect((await POST(request(undefined, cookie()))).status).toBe(503);
  expect((await login(request({ password: secret }))).status).toBe(503);
  expect(mocks.sql).not.toHaveBeenCalled();
});
