"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { arrowDirection } from "@/utils/postArrowKeys";

const FIELD = "input, textarea, select, [contenteditable]";
const OVERLAY = "dialog[open], [aria-modal='true']";

// True when the key should keep scrolling something sideways (code, tables).
function inHorizontalScroller(el: Element | null) {
  for (; el; el = el.parentElement) {
    if (el.tagName === "PRE") return true;
    if (el.scrollWidth <= el.clientWidth) continue;
    const { overflowX } = getComputedStyle(el);
    if (overflowX === "auto" || overflowX === "scroll") return true;
  }
  return false;
}

export default function PostArrowKeys({
  prevHref,
  nextHref,
}: {
  prevHref?: string;
  nextHref?: string;
}) {
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target instanceof Element ? e.target : null;
      const dir = arrowDirection({
        key: e.key,
        defaultPrevented: e.defaultPrevented,
        repeat: e.repeat,
        modified: e.metaKey || e.ctrlKey || e.altKey || e.shiftKey,
        blocked:
          !!target?.closest(FIELD) ||
          !!document.querySelector(OVERLAY) ||
          inHorizontalScroller(target),
      });
      const href = dir === "prev" ? prevHref : dir === "next" ? nextHref : null;
      if (href) router.push(href);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router, prevHref, nextHref]);

  return null;
}
