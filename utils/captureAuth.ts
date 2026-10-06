import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "./adminAuth";

/** A capture token grants insertion only, not the other admin APIs. */
export function checkCaptureAuth(request: NextRequest): NextResponse | null {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json(
      { error: "Cross-origin writes are not allowed" },
      { status: 403 }
    );
  }
  if (process.env.NODE_ENV !== "production") return null;

  const secret = process.env.CAPTURE_SECRET;
  const authorization = request.headers.get("authorization");
  if (secret && authorization?.startsWith("Bearer ")) {
    const expected = crypto.createHash("sha256").update(secret).digest();
    const actual = crypto
      .createHash("sha256")
      .update(authorization.slice(7))
      .digest();
    if (crypto.timingSafeEqual(expected, actual)) return null;
  }

  // Also permit the owner's existing admin session or admin API token.
  if (process.env.ADMIN_SECRET && !checkAdminAuth(request)) return null;
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
