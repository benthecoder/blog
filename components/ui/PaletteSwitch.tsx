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
      data-cuelume-toggle="bloom"
      title={`${PALETTE_LABELS[palette]} → ${PALETTE_LABELS[next]}`}
      aria-label={`Change color palette to ${PALETTE_LABELS[next]}`}
      className="w-fit h-fit p-0 m-0 bg-transparent border-none cursor-pointer"
    >
      {/* A plain swatch of the palette that's currently active — not an
          attempt at the hand-drawn style, which only reads as a bad copy
          next to the real scans. Swap in a drawing at /public/icons and
          render it through SketchIcon to have it tint like the rest. */}
      <span className="flex w-6 h-6 md:w-12 md:h-12 items-center justify-center">
        {/* Small mark in a full-size hit area — the notebook icons are sparse
            line art, so a solid disc at their bounding-box size overpowers
            them. */}
        <span className="block w-3.5 h-3.5 md:w-5 md:h-5 rounded-full bg-ink dark:bg-chalk transition-opacity duration-200 opacity-80 hover:opacity-100" />
      </span>
    </button>
  );
};

export default PaletteSwitch;
