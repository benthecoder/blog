import "server-only";

/** The email Benedict gets for each new /contact message. */
export function messageEmail(body: string, sender: string | null) {
  // The sender is visitor input: keep it to one line in the subject.
  const from = sender?.replace(/\s+/g, " ") ?? "someone";
  return {
    subject: `new message from ${from}`,
    text: `${body}\n\n— ${from}\n\nall messages: https://bneo.xyz/admin/messages`,
  };
}

/**
 * Emails a new message through Resend. Needs RESEND_API_KEY and
 * MESSAGE_NOTIFY_EMAIL; without them it does nothing, and the message is still
 * saved and readable at /admin/messages. MESSAGE_FROM_EMAIL defaults to
 * Resend's shared sender, which may only deliver to the account's own address.
 */
export async function notifyNewMessage(body: string, sender: string | null) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.MESSAGE_NOTIFY_EMAIL;
  if (!key || !to) return;
  const { subject, text } = messageEmail(body, sender);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from:
        process.env.MESSAGE_FROM_EMAIL ?? "bneo.xyz <onboarding@resend.dev>",
      to,
      subject,
      text,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok)
    console.error(
      "Message email failed:",
      response.status,
      await response.text()
    );
}
