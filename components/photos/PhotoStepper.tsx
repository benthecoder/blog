"use client";

import { useEffect, type ComponentProps } from "react";
import { useRouter } from "next/navigation";
import { preloadPhoto } from "./preloadPhoto";
import { useSwipe } from "./useSwipe";

type Props = ComponentProps<"div"> & {
  previousHref?: string;
  nextHref?: string;
  previousSrc?: string;
  nextSrc?: string;
};

// Arrow keys and swipes move between photos; neighbours are warmed up front.
export function PhotoStepper({
  previousHref,
  nextHref,
  previousSrc,
  nextSrc,
  ...props
}: Props) {
  const router = useRouter();
  const go = (direction: 1 | -1) => {
    const href = direction === 1 ? nextHref : previousHref;
    if (href) router.push(href);
  };
  const swipe = useSwipe(go);

  useEffect(() => {
    for (const href of [previousHref, nextHref]) {
      if (href) router.prefetch(href);
    }
    for (const src of [previousSrc, nextSrc]) {
      if (src) preloadPhoto(src, 80);
    }
  }, [router, previousHref, nextHref, previousSrc, nextSrc]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) {
        return;
      }
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      if (document.querySelector("dialog[open], [aria-modal='true']")) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable]")) return;
      go(event.key === "ArrowRight" ? 1 : -1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  return <div {...props} {...swipe} />;
}
