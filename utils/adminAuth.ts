import { NextRequest, NextResponse } from "next/server";

export function checkAdminAuth(request: NextRequest): NextResponse | null {
  const token = request.headers.get("x-admin-token");
  const adminSecret = process.env.ADMIN_SECRET;

  if (adminSecret && token === adminSecret) {
    return null;
  }

  // Allow browser-originated requests from this app's admin pages.
  // This keeps secrets server-only while preserving the existing admin UI flow.
  const referer = request.headers.get("referer");
  if (referer) {
    try {
      const requestUrl = new URL(request.url);
      const refererUrl = new URL(referer);
      const isSameOrigin = refererUrl.origin === requestUrl.origin;
      const fromAdminPage = refererUrl.pathname.startsWith("/admin");

      if (isSameOrigin && fromAdminPage) {
        return null;
      }
    } catch {
      // Ignore malformed referer and fall through to Unauthorized.
    }
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
