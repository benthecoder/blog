"use client";

import { useSyncExternalStore } from "react";
import { PALETTES, usePalette, type Palette } from "@/app/providers";

// Hydration-safe mounted flag: false during SSR/hydration, true after.
function useMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

const PALETTE_LABELS: Record<Palette, string> = {
  indigo: "indigo",
  olive: "olive",
  gold: "gold",
  steel: "steel",
  vermillion: "vermillion",
  rose: "rose",
};

const PaletteSwitch = () => {
  const mounted = useMounted();
  const { palette, setPalette } = usePalette();

  if (!mounted)
    return <div className="w-6 h-6 md:w-12 md:h-12" aria-hidden="true" />;

  const next = PALETTES[(PALETTES.indexOf(palette) + 1) % PALETTES.length];

  return (
    <button
      onClick={() => setPalette(next)}
      title={`${PALETTE_LABELS[palette]} → ${PALETTE_LABELS[next]}`}
      aria-label={`Change color palette to ${PALETTE_LABELS[next]}`}
      className="w-fit h-fit p-0 m-0 bg-transparent border-none cursor-pointer"
    >
      {/* Three overlapping circles, drawn as open paths that overshoot where
          they close — the same loose, round-capped pen line as the other
          notebook icons. Inherits the active palette's ink color. */}
      <svg
        viewBox="0 0 48 48"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="inline-block w-6 h-6 md:w-12 md:h-12 text-ink dark:text-chalk transition-opacity duration-200 opacity-80 hover:opacity-100"
      >
        <path
          strokeWidth="1.9"
          d="M8.6 20.1C7.9 14.6 12 9.4 17.6 9.1c5.5-.3 9.6 3.8 9.3 9.2-.3 5.3-4.6 9.3-10 9-4.7-.3-8-3.6-8.4-8.1-.1-.8.1-1.6.5-2.3"
        />
        <path
          strokeWidth="2.1"
          d="M21.2 17.4c.4-5.4 4.8-8.8 10.1-8.4 5.3.4 8.8 4.6 8.3 9.9-.5 5.3-4.8 9-10.1 8.6-4.9-.4-8.3-4.1-8.4-8.9 0-.6.1-1.2.3-1.8"
        />
        <path
          strokeWidth="2"
          d="M14.4 30.6c-.6-5.4 3.5-10.2 9-10.5 5.5-.3 9.6 3.8 9.3 9.2-.3 5.3-4.6 9.3-10 9-4.7-.3-8-3.6-8.4-8.1-.1-.8 0-1.6.3-2.3"
        />
      </svg>
    </button>
  );
};

export default PaletteSwitch;
