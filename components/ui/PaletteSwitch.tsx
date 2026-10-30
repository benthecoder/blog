"use client";

import { useSyncExternalStore } from "react";
import { Check } from "lucide-react";
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

  if (compact) {
    return (
      <details
        className="relative"
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget))
            event.currentTarget.open = false;
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.currentTarget.open = false;
            event.currentTarget.querySelector("summary")?.focus();
          }
        }}
      >
        <summary
          aria-label="Choose ink"
          title="Choose ink"
          className="flex size-8 cursor-pointer list-none text-xs items-center justify-center text-muted hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent [&::-webkit-details-marker]:hidden"
        >
          ink
        </summary>
        <div
          role="group"
          aria-label="Ink colors"
          className="absolute right-0 top-full z-50 mt-2 w-40 border border-accent/25 bg-raised p-2 shadow-sm"
        >
          {PALETTES.map((ink) => (
            <button
              key={ink}
              type="button"
              aria-pressed={palette === ink}
              onClick={(event) => {
                setPalette(ink);
                const details = event.currentTarget.closest("details");
                if (details) {
                  details.open = false;
                  details.querySelector("summary")?.focus();
                }
              }}
              className="flex w-full items-center justify-between px-2 py-1.5 text-left text-sm text-primary hover:bg-accent/10 focus-visible:outline-2 focus-visible:outline-accent"
            >
              {ink === "steel" ? "blue" : PALETTE_LABELS[ink]}
              {palette === ink && <Check size={14} aria-hidden="true" />}
            </button>
          ))}
        </div>
      </details>
    );
  }

  const next = PALETTES[(PALETTES.indexOf(palette) + 1) % PALETTES.length];

  return (
    <button
      onClick={() => setPalette(next)}
      data-cuelume-toggle="bloom"
      title={`${PALETTE_LABELS[palette]} → ${PALETTE_LABELS[next]}`}
      aria-label={`Change color palette to ${PALETTE_LABELS[next]}`}
      className="w-fit h-fit p-0 m-0 bg-transparent border-none cursor-pointer"
    >
      <span className="flex w-6 h-6 md:w-12 md:h-12 items-center justify-center">
        <span className="block w-3.5 h-3.5 md:w-5 md:h-5 rounded-full bg-accent transition-opacity duration-200 opacity-80 hover:opacity-100" />
      </span>
    </button>
  );
};

export default PaletteSwitch;
