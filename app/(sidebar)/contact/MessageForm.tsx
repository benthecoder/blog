"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { MESSAGE_MAX_LENGTH, SENDER_MAX_LENGTH } from "@/utils/messages/input";

const fieldClass =
  "w-full rounded-sm border border-line bg-transparent px-3 py-3 text-base text-primary placeholder:text-muted/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent" }
  | { kind: "error"; message: string };

const FAILED = "Couldn’t send right now. Try again in a bit.";

export function MessageForm() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setStatus({ kind: "sending" });
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form)),
      });
      if (response.ok) return setStatus({ kind: "sent" });
      const data = await response.json().catch(() => null);
      setStatus({ kind: "error", message: data?.error ?? FAILED });
    } catch {
      setStatus({ kind: "error", message: FAILED });
    }
  }

  if (status.kind === "sent")
    return (
      <p role="status" className="text-primary">
        message received, thank you.
      </p>
    );

  return (
    <form onSubmit={send} className="space-y-4">
      <label className="block">
        <span className="sr-only">message</span>
        <textarea
          name="body"
          required
          maxLength={MESSAGE_MAX_LENGTH}
          rows={5}
          placeholder="say hi, ask anything"
          className={`${fieldClass} resize-y leading-relaxed`}
        />
      </label>
      <label className="block">
        <span className="sr-only">name or where you’re from (optional)</span>
        <input
          name="sender"
          maxLength={SENDER_MAX_LENGTH}
          autoComplete="off"
          placeholder="name or where you’re from (optional)"
          className={fieldClass}
        />
      </label>
      {/* Honeypot: hidden from people and screen readers; bots fill it in. */}
      <input
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="sr-only"
      />
      <div className="flex flex-wrap items-center gap-4">
        <Button
          type="submit"
          variant="solid"
          disabled={status.kind === "sending"}
        >
          {status.kind === "sending" ? "sending…" : "send"}
        </Button>
        {status.kind === "error" && (
          <p role="alert" className="text-sm text-danger">
            {status.message}
          </p>
        )}
      </div>
    </form>
  );
}
