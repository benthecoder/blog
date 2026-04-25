import { NextRequest, NextResponse } from "next/server";

export function checkAdminAuth(request: NextRequest): NextResponse | null {
  const token = request.headers.get("x-admin-token");
  if (!token || token !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
