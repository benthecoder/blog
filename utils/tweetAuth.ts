import { ADMIN_COOKIE, safeEqual, verifyAdminSession } from "@/utils/adminAuth";

function cookieValue(header: string | null, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i).trim() === name) {
      return part.slice(i + 1).trim();
    }
  }
  return undefined;
}

// Production: admin cookie / x-admin-token, or a separate posting-only
// TWEET_TOKEN bearer so the phone shortcut never holds ADMIN_SECRET.
// Fails closed: an unset/empty secret never authorizes.
export function isTweetAuthorized(request: Request): boolean {
  if (process.env.NODE_ENV !== "production") return true;

  const adminSecret = process.env.ADMIN_SECRET;
  if (adminSecret) {
    const header = request.headers.get("x-admin-token");
    if (header && safeEqual(header, adminSecret)) return true;
    const cookie = cookieValue(request.headers.get("cookie"), ADMIN_COOKIE);
    if (cookie && verifyAdminSession(cookie, adminSecret)) return true;
  }

  const tweetToken = process.env.TWEET_TOKEN;
  const auth = request.headers.get("authorization");
  // The auth scheme is case-insensitive (RFC 9110).
  const supplied = auth?.match(/^bearer\s+(.+)$/i)?.[1].trim();
  if (tweetToken && supplied && safeEqual(supplied, tweetToken)) return true;
  return false;
}
