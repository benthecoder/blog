"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export async function goRandom(router: ReturnType<typeof useRouter>) {
  window.dispatchEvent(new CustomEvent("random-spin"));
  const res = await fetch("/api/random", { cache: "no-store" });
  const data = await res.json();
  router.push(`/posts/${data.slug}`);
}

export function useRandomPost() {
  const router = useRouter();
  const navigating = useRef(false);

  useEffect(() => {
    function trigger() {
      if (navigating.current) return;
      navigating.current = true;
      goRandom(router).finally(() => {
        navigating.current = false;
      });
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key.toLowerCase() !== "r" || e.metaKey || e.ctrlKey || e.altKey)
        return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      trigger();
    }

    function onDiceClick() {
      trigger();
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("random-dice-click", onDiceClick);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("random-dice-click", onDiceClick);
    };
  }, [router]);
}
