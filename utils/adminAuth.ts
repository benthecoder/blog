import { NextRequest, NextResponse } from "next/server";

const ADMIN_COOKIE = "admin_session";

export function checkAdminAuth(request: NextRequest): NextResponse | null {
  const adminSecret = process.env.ADMIN_SECRET;

  if (!adminSecret) {
    return NextResponse.json(
      { error: "Admin auth not configured" },
      { status: 500 }
    );
  }

  const token = request.headers.get("x-admin-token");
  const cookieToken = request.cookies.get(ADMIN_COOKIE)?.value;

  if (token === adminSecret || cookieToken === adminSecret) {
    return null;
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
