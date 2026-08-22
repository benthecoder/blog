"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
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
  graphite: "graphite",
};

const PaletteSwitch = () => {
  const mounted = useMounted();
  const { palette, setPalette } = usePalette();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  if (!mounted)
    return <div className="w-6 h-6 md:w-12 md:h-12" aria-hidden="true" />;

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        onClick={() => setOpen((v) => !v)}
        aria-label={`Colour: ${PALETTE_LABELS[palette]}. Choose another`}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex w-6 h-6 md:w-12 md:h-12 items-center justify-center bg-transparent border-none cursor-pointer p-0 m-0"
      >
        {/* Placeholder mark until the drawn palette icon exists — swap this
            span for <SketchIcon src="/icons/palette.svg" /> and it will tint
            with the theme like the rest of the notebook icons. */}
        <span className="block w-3.5 h-3.5 md:w-5 md:h-5 rounded-full bg-ink dark:bg-chalk transition-opacity duration-200 opacity-80 hover:opacity-100" />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Colours"
          className="absolute right-0 top-full mt-2 flex gap-2 p-2 rounded-sm bg-paper dark:bg-night-raised border border-rule dark:border-night-rule shadow-lg z-50"
        >
          {PALETTES.map((id) => (
            <button
              key={id}
              role="menuitemradio"
              aria-checked={palette === id}
              title={PALETTE_LABELS[id]}
              aria-label={PALETTE_LABELS[id]}
              onClick={() => {
                setPalette(id);
                close();
              }}
              data-palette={id}
              className={`swatch w-5 h-5 rounded-full transition-transform hover:scale-110 ${
                palette === id
                  ? "ring-2 ring-offset-2 ring-ink dark:ring-chalk ring-offset-paper dark:ring-offset-night-raised"
                  : ""
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PaletteSwitch;
