"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { play } from "cuelume";

// Fetched at most once per page load, then reused for every subsequent press.
let slugsPromise: Promise<string[]> | null = null;

function loadSlugs(): Promise<string[]> {
  slugsPromise ??= fetch("/api/post-slugs")
    .then((res) => res.json())
    .then((data: { slugs: string[] }) => data.slugs)
    .catch((err) => {
      slugsPromise = null; // let the next press retry
      throw err;
    });
  return slugsPromise;
}

async function goRandom(router: ReturnType<typeof useRouter>) {
  play("sparkle");
  window.dispatchEvent(new CustomEvent("random-spin"));
  const slugs = await loadSlugs();
  if (!slugs.length) return;
  const slug = slugs[Math.floor(Math.random() * slugs.length)];
  router.push(`/posts/${slug}`);
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
