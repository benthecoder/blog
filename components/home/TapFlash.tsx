"use client";

import { useEffect } from "react";

// The one bit of motion on the home screen: tapping an app inverts it for a
// beat, the way an e-ink screen flashes a selection before it navigates.
// :active covers most of this, but a quick tap can navigate before :active
// ever paints, so the inversion is also pinned on with a data attribute.
export function TapFlash() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const onDown = (e: PointerEvent) => {
      if (reduce.matches) return;
      const tile = (e.target as Element | null)?.closest<HTMLElement>(
        "[data-app]"
      );
      if (!tile) return;
      tile.dataset.flash = "";
      const t = setTimeout(() => {
        delete tile.dataset.flash;
        timers.delete(t);
      }, 180);
      timers.add(t);
    };
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      timers.forEach(clearTimeout);
    };
  }, []);
  return null;
}
