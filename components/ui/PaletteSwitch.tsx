"use client";

import { useSyncExternalStore } from "react";
import { PALETTES, usePalette, type Palette } from "@/app/providers";
import { SketchIcon } from "./SketchIcon";

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

const PaletteSwitch = ({ compact = false }: { compact?: boolean }) => {
  const mounted = useMounted();
  const { palette, setPalette } = usePalette();

  if (!mounted)
    return (
      <div
        className={compact ? "size-8" : "w-6 h-6 md:w-12 md:h-12"}
        aria-hidden="true"
      />
    );

  const next = PALETTES[(PALETTES.indexOf(palette) + 1) % PALETTES.length];

  return (
    <button
      onClick={() => setPalette(next)}
      data-cuelume-toggle="bloom"
      title={`${PALETTE_LABELS[palette]} → ${PALETTE_LABELS[next]}`}
      aria-label={`Change color palette to ${PALETTE_LABELS[next]}`}
      className={
        compact
          ? "flex size-8 items-center justify-center text-muted hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          : "flex w-fit h-fit p-0 m-0 bg-transparent border-none cursor-pointer"
      }
    >
      {/* SketchIcon masks the black line art with bg-accent, so the
          drawing tints with the palette it switches to. */}
      <SketchIcon
        src="/icons/palette.svg"
        className={
          compact
            ? "size-8"
            : "w-6 h-6 md:w-12 md:h-12 transition-opacity duration-200 opacity-80 hover:opacity-100"
        }
      />
    </button>
  );
};

export default PaletteSwitch;
