"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import type { Quote } from "@/utils/content/quotes";

// Picked once per page load on the client. Hydration uses the server
// snapshot (the first quote), then React swaps in this one, so the markup
// always matches.
const startRoll = typeof window === "undefined" ? 0 : Math.random();
const noop = () => () => {};
// Same treatment as "all writings →" and "all photos →" above it.
const action =
  "hover:text-accent hover:underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent";

export function QuoteFooter({ quotes }: { quotes: Quote[] }) {
  const start = useSyncExternalStore(
    noop,
    () => Math.floor(startRoll * quotes.length),
    () => 0
  );
  const [step, setStep] = useState(0);

  if (quotes.length === 0) return null;
  const quote = quotes[(start + step) % quotes.length];
  const next = () => setStep(step + 1);

  return (
    <footer className="mt-20 text-sm text-muted">
      <Link
        href={`/posts/${encodeURIComponent(quote.slug)}`}
        className="hover:text-accent transition-colors"
      >
        {quote.text}
      </Link>{" "}
      &mdash; {quote.author}{" "}
      <span className="mt-2 flex gap-x-6">
        <button type="button" onClick={next} className={action}>
          another quote
        </button>
        <Link href="/words" className={action}>
          all quotes →
        </Link>
      </span>
    </footer>
  );
}
