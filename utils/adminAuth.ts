import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

export const ADMIN_COOKIE = "admin_session";

// Hash both sides so inputs of different lengths can be compared and the
// comparison time never depends on how many leading characters match.
function safeEqual(a: string, b: string): boolean {
  const ha = crypto.createHash("sha256").update(a).digest();
  const hb = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

// The cookie stores this derived token rather than ADMIN_SECRET itself, so a
// leaked cookie doesn't expose the secret.
export function sessionToken(secret: string): string {
  return crypto.createHmac("sha256", secret).update(ADMIN_COOKIE).digest("hex");
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
    (cookieToken && safeEqual(cookieToken, sessionToken(adminSecret)))
  ) {
    return null;
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function verifyAdminPassword(password: string, secret: string): boolean {
  return safeEqual(password, secret);
}
