"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { QUOTES } from "@/config/quotes";

// Picked once per page load on the client. Hydration uses the server
// snapshot (the first quote), then React swaps in this one, so the markup
// always matches.
const startIndex =
  typeof window === "undefined" ? 0 : Math.floor(Math.random() * QUOTES.length);
const noop = () => () => {};

export function QuoteFooter() {
  const start = useSyncExternalStore(
    noop,
    () => startIndex,
    () => 0
  );
  const [step, setStep] = useState(0);

  const quote = QUOTES[(start + step) % QUOTES.length];
  const next = () => setStep(step + 1);

  return (
    <footer className="mt-24 text-sm text-muted">
      <Link
        href={`/posts/${quote.slug}`}
        className="hover:text-accent transition-colors"
      >
        {quote.text}
      </Link>{" "}
      &mdash; {quote.author}{" "}
      <button
        type="button"
        onClick={next}
        className="ml-1 underline underline-offset-4 decoration-accent/30 hover:text-accent focus-visible:outline-2 focus-visible:outline-accent"
      >
        view another
      </button>
    </footer>
  );
}
