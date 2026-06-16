import { NextRequest, NextResponse } from "next/server";

const ADMIN_COOKIE = "admin_session";

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname === "/api/admin/login" || pathname === "/admin/login") {
    return NextResponse.next();
  }

  const secret = process.env.ADMIN_SECRET;
  const cookie = request.cookies.get(ADMIN_COOKIE)?.value;
  const authorized = Boolean(secret) && cookie === secret;

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
