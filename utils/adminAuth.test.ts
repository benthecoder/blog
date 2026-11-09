import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";
import {
  ADMIN_COOKIE,
  ADMIN_SESSION_SECONDS,
  verifyAdminSession,
  checkAdminAuth,
  sessionToken,
  verifyAdminPassword,
} from "./adminAuth";

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

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("admin password comparison", () => {
  it("accepts matching UTF-8 secrets", () => {
    expect(verifyAdminPassword("秘密🔐", "秘密🔐")).toBe(true);
  });

  it.each([
    "",
    "test-admin-secre",
    "test-admin-secret-extra",
    "test-admin-secret\0",
    "Test-admin-secret",
  ])("rejects different lengths and content: %s", (password) =>
    expect(verifyAdminPassword(password, SECRET)).toBe(false)
  );

  it("rejects zero padding and different UTF-8 bytes", () => {
    expect(verifyAdminPassword("secret", "secret\0")).toBe(false);
    expect(verifyAdminPassword("秘密🔑", "秘密🔐")).toBe(false);
  });
});

describe("admin session access", () => {
  it("accepts an expiring Web Crypto cookie in the proxy and route guard", async () => {
    production();
    const now = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(now);
    const expires = String(Math.floor(now / 1000) + ADMIN_SESSION_SECONDS);
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
      new TextEncoder().encode(`${ADMIN_COOKIE}:${expires}`)
    );
    const cookie = `${expires}.${Buffer.from(signature).toString("hex")}`;
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

describe("session lifetime", () => {
  it("rejects expiry, forged expiry, and legacy non-expiring tokens", () => {
    const now = 1_800_000_000_000;
    const token = sessionToken(SECRET, now);
    expect(verifyAdminSession(token, SECRET, now)).toBe(true);
    expect(
      verifyAdminSession(token, SECRET, now + ADMIN_SESSION_SECONDS * 1000)
    ).toBe(false);
    const [expires, signature] = token.split(".");
    expect(
      verifyAdminSession(`${Number(expires) + 86400}.${signature}`, SECRET, now)
    ).toBe(false);
    expect(verifyAdminSession("a".repeat(64), SECRET, now)).toBe(false);
  });
});
