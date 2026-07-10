"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { FormEvent } from "react";

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
        disabled={isPending}
        maxLength={280}
        onChange={(e) => setRemainingChars(280 - e.target.value.length)}
        name="entry"
        type="text"
        required
        className="pl-4 pr-24 py-2 mt-1 focus:outline-none block w-full border border-japanese-shiraumenezu dark:border-white/[0.08] bg-japanese-kinairo dark:bg-dark-tag text-japanese-sumiiro dark:text-japanese-shironezu placeholder:text-japanese-sumiiro/30 dark:placeholder:text-japanese-shironezu/30"
      />
      <div className="flex items-center justify-between mt-1">
        <span className="text-xs text-japanese-sumiiro/40 dark:text-japanese-shironezu/40">
          {remainingChars} remaining
        </span>
        {submitError && (
          <span className="text-xs text-red-500">{submitError}</span>
        )}
      </div>

      <button
        className="flex items-center justify-center absolute right-1 top-1 px-2 py-1 font-medium h-8 bg-japanese-shiraumenezu/40 dark:bg-white/[0.08] hover:bg-japanese-shiraumenezu dark:hover:bg-white/[0.14] text-japanese-sumiiro dark:text-japanese-shironezu transition-colors w-16"
        disabled={isMutating}
        type="submit"
      >
        🌊
      </button>
    </form>
  );
}
