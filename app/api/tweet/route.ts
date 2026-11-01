import { neon } from "@neondatabase/serverless";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth, verifyAdminPassword } from "@/utils/adminAuth";
import { checkRateLimit } from "@/utils/rateLimit";
import { clientIp, hashViewer } from "@/utils/clientIp";
import { thoughtInputSchema } from "@/utils/tweets/input";

import { parsePublicUrl } from "@/utils/tweets/link";

const URL_RE = /https?:\/\/[^\s]+/;

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    const rate = await checkRateLimit({
      scope: "thought-publish",
      viewer: hashViewer(clientIp(request)),
      limit: 20,
      windowSeconds: 60,
      failOpen: false,
    });
    if (!rate.ok)
      return NextResponse.json(
        {
          error:
            rate.reason === "unavailable"
              ? "Publishing is temporarily unavailable. Try again shortly."
              : "Too many requests. Try again shortly.",
        },
        {
          status: rate.reason === "unavailable" ? 503 : 429,
          headers: { "Retry-After": String(rate.retryAfter) },
        }
      );
    const captureSecret = process.env.TWEET_SECRET;
    const authorization = request.headers.get("authorization");
    const captureToken = authorization?.startsWith("Bearer ")
      ? authorization.slice(7)
      : null;
    const shortcutAuthorized =
      captureSecret &&
      captureToken &&
      verifyAdminPassword(captureToken, captureSecret);
    if (!shortcutAuthorized) {
      const denied = checkAdminAuth(
        new NextRequest(request.url, { headers: request.headers })
      );
      if (denied) return denied;
    }
  }
  const input: unknown = await request.json().catch(() => null);
  const parsed = thoughtInputSchema.safeParse(input);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Use a note of up to 5,000 characters and a valid public link.",
      },
      { status: 400 }
    );
  }
  const body = parsed.data;
  let content = body.body.trim();
  let link = body.link ? parsePublicUrl(body.link) : null;

  // No explicit link: lift the first URL out of the text.
  if (!link) {
    const found = content.match(URL_RE);
    const parsed = found && parsePublicUrl(found[0]);
    if (found && parsed) {
      link = parsed;
      content = content.replace(found[0], "").trim();
    }
  }

  // The server never fetches the link; the draft script resolves missing titles
  // locally. A client (e.g. the shortcut) may send one.
  const title =
    link && typeof body.title === "string"
      ? body.title.replace(/\s+/g, " ").trim().slice(0, 300) || null
      : null;

  if (!content.trim() && !link) {
    return new Response(JSON.stringify({ error: "Empty tweet" }), {
      status: 400,
    });
  }

  try {
    const sql = neon(process.env.POSTGRES_URL!, {
      fetchOptions: { signal: AbortSignal.timeout(10_000) },
    });
    const result =
      await sql`INSERT INTO tweets(content, link, link_title, created_at) VALUES(${content}, ${link}, ${title}, NOW()) RETURNING *`;
    revalidatePath("/thoughts");
    return new Response(JSON.stringify({ error: null, tweet: result[0] }), {
      status: 200,
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Error inserting tweet" }), {
      status: 500,
    });
  }
}

export async function DELETE(request: Request) {
  // Local authoring only.
  if (process.env.NODE_ENV === "production") {
    return new Response(null, { status: 403 });
  }

  const body = await request.json();
  const id = body.id;

  try {
    const sql = neon(process.env.POSTGRES_URL!, {
      fetchOptions: { signal: AbortSignal.timeout(10_000) },
    });
    await sql`DELETE FROM tweets WHERE id = ${id}`;
    revalidatePath("/thoughts");
    return new Response(null, { status: 204 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Error deleting tweet" }), {
      status: 500,
    });
  }
}
