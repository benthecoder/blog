import { NextResponse } from "next/server";
import { getPostSlugs } from "@/utils/content/posts";

// Static on purpose. The dice used to hit a force-dynamic route that picked a
// slug server-side, which meant a function invocation per press and no way to
// cache it (the whole point is a different answer each time). Shipping the
// list once and rolling the die in the browser makes the dice free and
// instant, at the cost of a few KB the visitor fetches only if they use it.
export const dynamic = "force-static";

export function GET() {
  return NextResponse.json({ slugs: getPostSlugs() });
}
