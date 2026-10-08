import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";
import { ADMIN_COOKIE, checkAdminAuth, sessionToken } from "./adminAuth";

const SECRET = "test-admin-secret";

function request(path: string, cookie?: string, header?: string) {
  return new NextRequest(`https://example.test${path}`, {
    headers: {
      ...(cookie ? { Cookie: `${ADMIN_COOKIE}=${cookie}` } : {}),
      ...(header ? { "x-admin-token": header } : {}),
    },
  });
}

function production() {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("ADMIN_SECRET", SECRET);
}

afterEach(() => vi.unstubAllEnvs());

describe("admin session access", () => {
  it("accepts the existing Web Crypto cookie in the proxy and route guard", async () => {
    production();
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signature = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(ADMIN_COOKIE)
    );
    const cookie = Buffer.from(signature).toString("hex");
    expect(sessionToken(SECRET)).toBe(cookie);
    const req = request("/api/admin/get-post", cookie);
    expect(proxy(req).headers.get("x-middleware-next")).toBe("1");
    expect(checkAdminAuth(req)).toBeNull();
  });

  it.each(["invalid", SECRET, sessionToken("old-secret"), "a".repeat(1000)])(
    "rejects invalid or stale cookies: %s",
    (cookie) => {
      production();
      const req = request("/api/admin/get-post", cookie);
      expect(proxy(req).status).toBe(401);
      expect(checkAdminAuth(req)?.status).toBe(401);
    }
  );

  it("preserves the proxy's cookie-only policy for header tokens", () => {
    production();
    const req = request("/api/admin/get-post", undefined, SECRET);
    expect(checkAdminAuth(req)).toBeNull();
    expect(proxy(req).status).toBe(401);
  });

  it("fails closed with no configured secret", () => {
    production();
    vi.stubEnv("ADMIN_SECRET", "");
    const req = request("/api/admin/get-post", sessionToken(SECRET));
    expect(proxy(req).status).toBe(401);
    expect(checkAdminAuth(req)?.status).toBe(500);
  });

  it("keeps production admin pages closed even with a valid cookie", () => {
    production();
    expect(
      proxy(request("/admin/edit/new", sessionToken(SECRET))).headers.get(
        "location"
      )
    ).toBe("https://example.test/");
  });

  it.each(["/admin/login", "/api/admin/login"])(
    "allows the login endpoint %s",
    (path) => {
      production();
      expect(proxy(request(path)).headers.get("x-middleware-next")).toBe("1");
    }
  );

  it("keeps local authoring available without credentials", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("ADMIN_SECRET", "");
    const req = request("/api/admin/get-post");
    expect(proxy(req).headers.get("x-middleware-next")).toBe("1");
    expect(checkAdminAuth(req)).toBeNull();
  });
});
