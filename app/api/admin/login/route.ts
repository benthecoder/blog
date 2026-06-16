import { NextRequest, NextResponse } from "next/server";

const ADMIN_COOKIE = "admin_session";

export async function POST(request: NextRequest) {
  const secret = process.env.ADMIN_SECRET;

  if (!secret) {
    return NextResponse.json(
      { error: "Admin auth not configured" },
      { status: 500 }
    );
  }

  const { password } = await request.json();

  if (password !== secret) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(ADMIN_COOKIE, secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(ADMIN_COOKIE);
  return response;
}
