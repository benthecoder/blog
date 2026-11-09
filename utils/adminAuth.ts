import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

export const ADMIN_COOKIE = "admin_session";
export const ADMIN_SESSION_SECONDS = 60 * 60 * 24 * 30;

// Compare secret bytes directly without a fast password hash. Pad the supplied
// value to the expected byte length so timingSafeEqual also handles mismatches.
function safeEqual(a: string, b: string): boolean {
  const supplied = Buffer.from(a);
  const expected = Buffer.from(b);
  const padded = Buffer.alloc(expected.length);
  supplied.copy(padded);
  const equal = crypto.timingSafeEqual(padded, expected);
  return equal && supplied.length === expected.length;
}

// Sign the expiry as well as the cookie name, so retaining a cookie cannot
// extend the session beyond its server-enforced lifetime.
function sessionSignature(secret: string, expires: string): string {
  return crypto
    .createHmac("sha256", secret)
    .update(`${ADMIN_COOKIE}:${expires}`)
    .digest("hex");
}

export function sessionToken(secret: string, nowMs = Date.now()): string {
  const expires = String(Math.floor(nowMs / 1000) + ADMIN_SESSION_SECONDS);
  return `${expires}.${sessionSignature(secret, expires)}`;
}

export function verifyAdminSession(
  token: string,
  secret: string,
  nowMs = Date.now()
): boolean {
  const match = /^(\d{1,12})\.([a-f0-9]{64})$/.exec(token);
  if (!match) return false;
  const [, expires, signature] = match;
  if (Number(expires) <= Math.floor(nowMs / 1000)) return false;
  return safeEqual(signature, sessionSignature(secret, expires));
}

export function checkAdminAuth(request: NextRequest): NextResponse | null {
  if (process.env.NODE_ENV !== "production") return null;

  const adminSecret = process.env.ADMIN_SECRET;

  if (!adminSecret) {
    return NextResponse.json(
      { error: "Admin auth not configured" },
      { status: 500 }
    );
  }

  const token = request.headers.get("x-admin-token");
  const cookieToken = request.cookies.get(ADMIN_COOKIE)?.value;

  if (
    (token && safeEqual(token, adminSecret)) ||
    (cookieToken && verifyAdminSession(cookieToken, adminSecret))
  ) {
    return null;
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function verifyAdminPassword(password: string, secret: string): boolean {
  return safeEqual(password, secret);
}
