import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

export const ADMIN_COOKIE = "admin_session";

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

// The cookie stores this derived token rather than ADMIN_SECRET itself, so a
// leaked cookie doesn't expose the secret.
export function sessionToken(secret: string): string {
  return crypto.createHmac("sha256", secret).update(ADMIN_COOKIE).digest("hex");
}

export function verifyAdminSession(token: string, secret: string): boolean {
  return safeEqual(token, sessionToken(secret));
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
