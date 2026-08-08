import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_COOKIE = "admin_session";

// Must match sessionToken() in utils/adminAuth.ts. Recomputed here with Web
// Crypto because proxy code can't rely on node:crypto.
async function sessionToken(secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(ADMIN_COOKIE)
  );
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Admin is a local authoring tool; dev runs unauthenticated, same as
  // checkAdminAuth().
  if (process.env.NODE_ENV !== "production") {
    return NextResponse.next();
  }

  if (pathname === "/api/admin/login" || pathname === "/admin/login") {
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const secret = process.env.ADMIN_SECRET;
  const cookie = request.cookies.get(ADMIN_COOKIE)?.value;
  const authorized =
    Boolean(secret) &&
    Boolean(cookie) &&
    cookie === (await sessionToken(secret!));

  if (authorized) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loginUrl = new URL("/admin/login", request.url);
  loginUrl.searchParams.set("next", pathname + search);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
