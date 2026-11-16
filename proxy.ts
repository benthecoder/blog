import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { ADMIN_COOKIE, verifyAdminSession } from "@/utils/adminAuth";

const PUBLIC_ADMIN_PAGE = "/admin/messages";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const origin = request.headers.get("origin");
  if (
    origin &&
    origin !== request.nextUrl.origin &&
    request.method !== "GET" &&
    request.method !== "HEAD"
  ) {
    return NextResponse.json(
      { error: "Same-origin requests required" },
      { status: 403 }
    );
  }

  // Admin is a local authoring tool; dev runs unauthenticated, same as
  // checkAdminAuth().
  if (process.env.NODE_ENV !== "production") {
    return NextResponse.next();
  }

  if (pathname === "/api/admin/login" || pathname === "/admin/login") {
    return NextResponse.next();
  }

  // The messages inbox is the one admin page readable on the live site, so
  // the link in each notification email opens on a phone. It still needs the
  // admin session below.
  if (pathname.startsWith("/admin") && pathname !== PUBLIC_ADMIN_PAGE) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const secret = process.env.ADMIN_SECRET;
  const cookie = request.cookies.get(ADMIN_COOKIE)?.value;
  const authorized = secret && cookie && verifyAdminSession(cookie, secret);

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
