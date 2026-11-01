"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/ui/Button";

export default function Form() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isFetching, setIsFetching] = useState(false);
  const [remainingChars, setRemainingChars] = useState(280);

  const [submitError, setSubmitError] = useState<string | null>(null);
  const isMutating = isFetching || isPending;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsFetching(true);
    setSubmitError(null);

    const form = e.currentTarget;
    const input = form.elements.namedItem("entry") as HTMLInputElement;

    try {
      const res = await fetch("/api/tweet", {
        body: JSON.stringify({ body: input.value }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      const { error } = await res.json();
      if (error) {
        setSubmitError(error);
      } else {
        input.value = "";
        setRemainingChars(280);
        startTransition(() => router.refresh());
      }
    } catch {
      setSubmitError("failed to send");
    } finally {
      setIsFetching(false);
    }
  }

  return (
    <form
      className={`relative max-w-[500px] mb-20 transition-opacity ${isMutating ? "opacity-70" : "opacity-100"}`}
      onSubmit={onSubmit}
    >
      <input
        aria-label="What's on your mind?"
        placeholder="What's on your mind?"
        disabled={isMutating}
        maxLength={280}
        onChange={(e) => setRemainingChars(280 - e.target.value.length)}
        name="entry"
        type="text"
        required
        className="pl-4 pr-24 py-2 mt-1 focus:outline-hidden block w-full border border-line bg-paper dark:bg-night-raised text-accent placeholder:text-accent/30"
      />
      <div className="flex items-center justify-between mt-1">
        <span className="text-xs text-accent/40">
          {remainingChars} remaining
        </span>
        {submitError && (
          <span className="text-xs text-danger">{submitError}</span>
        )}
      </div>

      <Button
        type="submit"
        variant="outline"
        size="sm"
        className="absolute right-1 top-1 w-16"
        disabled={isMutating}
      >
        🌊
      </Button>
    </form>
  );
}
