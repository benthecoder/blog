import { neon } from "@neondatabase/serverless";
import { after, NextResponse } from "next/server";
import { checkRateLimit } from "@/utils/rateLimit";
import { clientIp, hashViewer } from "@/utils/clientIp";
import { messageInputSchema } from "@/utils/messages/input";
import { notifyNewMessage } from "@/utils/messages/notify";

/*
  Private notes left on /contact, read at /admin/messages and emailed when
  Resend is configured (utils/messages/notify.ts). Table:

  CREATE TABLE IF NOT EXISTS messages (
    id serial PRIMARY KEY,
    body text NOT NULL,
    sender text,
    created_at timestamptz NOT NULL DEFAULT now()
  );
*/
export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    // Fails closed: anyone can write here, so no limiter means no writes.
    const rate = await checkRateLimit({
      scope: "message",
      viewer: hashViewer(clientIp(request)),
      limit: 5,
      windowSeconds: 3600,
      failOpen: false,
    });
    if (!rate.ok)
      return NextResponse.json(
        {
          error:
            rate.reason === "unavailable"
              ? "Couldn’t send right now. Try again in a bit."
              : "That’s a lot of messages. Try again in an hour.",
        },
        {
          status: rate.reason === "unavailable" ? 503 : 429,
          headers: { "Retry-After": String(rate.retryAfter) },
        }
      );
  }

  const parsed = messageInputSchema.safeParse(
    await request.json().catch(() => null)
  );
  if (!parsed.success)
    return NextResponse.json(
      { error: "Write a message of up to 2,000 characters." },
      { status: 400 }
    );
  const { body, sender, website } = parsed.data;
  // A bot filled the hidden field: answer as if it worked, store nothing.
  if (website) return new Response(null, { status: 204 });

  try {
    const sql = neon(process.env.POSTGRES_URL!, {
      fetchOptions: { signal: AbortSignal.timeout(10_000) },
    });
    await sql`INSERT INTO messages (body, sender) VALUES (${body}, ${sender})`;
    // Saved first, emailed after the response: a slow or failing email never
    // holds up the visitor's "message received".
    after(() =>
      notifyNewMessage(body, sender).catch((error) =>
        console.error("Message email failed:", error)
      )
    );
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Error saving message:", error);
    return NextResponse.json(
      { error: "Couldn’t send right now. Try again in a bit." },
      { status: 500 }
    );
  }
}
