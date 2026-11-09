import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  ADMIN_SESSION_SECONDS,
  sessionToken,
  verifyAdminPassword,
} from "@/utils/adminAuth";

import { checkRateLimit } from "@/utils/rateLimit";
import { clientIp, hashViewer } from "@/utils/clientIp";
import { z } from "zod";

const loginSchema = z.object({ password: z.string().max(1024) });

export async function POST(request: NextRequest) {
  const secret = process.env.ADMIN_SECRET;

  if (!secret) {
    return NextResponse.json(
      { error: "Admin auth not configured" },
      { status: 500 }
    );
  }

  if (process.env.NODE_ENV === "production") {
    const rate = await checkRateLimit({
      scope: "login",
      viewer: hashViewer(clientIp(request)),
      limit: 5,
      windowSeconds: 60,
      failOpen: false,
    });
    if (!rate.ok)
      return NextResponse.json(
        {
          error:
            rate.reason === "unavailable"
              ? "Sign-in is temporarily unavailable. Try again shortly."
              : "Too many sign-in attempts. Try again shortly.",
        },
        {
          status: rate.reason === "unavailable" ? 503 : 429,
          headers: { "Retry-After": String(rate.retryAfter) },
        }
      );
  }
  const body: unknown = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter your passphrase" },
      { status: 400 }
    );
  }
  if (!verifyAdminPassword(parsed.data.password, secret)) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(ADMIN_COOKIE, sessionToken(secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_SECONDS,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(ADMIN_COOKIE);
  return response;
}
