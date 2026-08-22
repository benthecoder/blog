"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { ThemeProvider } from "next-themes";
import { bind, setVolume } from "cuelume";

export const PALETTES = [
  "indigo",
  "olive",
  "gold",
  "steel",
  "vermillion",
  "rose",
  "graphite",
] as const;

export type Palette = (typeof PALETTES)[number];

const DEFAULT_PALETTE: Palette = "steel";
const STORAGE_KEY = "palette";

type PaletteContextValue = {
  palette: Palette;
  setPalette: (palette: Palette) => void;
};

const PaletteContext = createContext<PaletteContextValue | undefined>(
  undefined
);

// next-themes' ThemeProvider is already handling light/dark via `class`; it
// isn't meant to be nested for a second independent axis (a nested instance
// detects the outer context and no-ops), so the palette axis gets its own
// minimal provider instead.
function readStoredPalette(): Palette {
  if (typeof window === "undefined") return DEFAULT_PALETTE;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return (PALETTES as readonly string[]).includes(stored ?? "")
    ? (stored as Palette)
    : DEFAULT_PALETTE;
}

const INIT_SCRIPT = `(function(){try{var v=localStorage.getItem(${JSON.stringify(
  STORAGE_KEY
)});var valid=${JSON.stringify(PALETTES)};document.documentElement.setAttribute("data-palette",valid.indexOf(v)>-1?v:${JSON.stringify(
  DEFAULT_PALETTE
)});}catch(e){}})();`;

function PaletteProvider({ children }: { children: ReactNode }) {
  const [palette, setPaletteState] = useState<Palette>(readStoredPalette);

  useEffect(() => {
    document.documentElement.setAttribute("data-palette", palette);
  }, [palette]);

  const setPalette = (next: Palette) => {
    setPaletteState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // localStorage may be unavailable (private browsing); palette still
      // applies for the session via React state.
    }
  };

  return (
    <PaletteContext.Provider value={{ palette, setPalette }}>
      <script
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: INIT_SCRIPT }}
      />
      {children}
    </PaletteContext.Provider>
  );
}

export function usePalette() {
  const ctx = useContext(PaletteContext);
  if (!ctx) throw new Error("usePalette must be used within Providers");
  return ctx;
}

const SOUND_VOLUME = 0.6;

// bind() delegates from `document`, so one call covers every
// data-cuelume-* element, including ones added by later navigations.
function SoundCues() {
  useEffect(() => {
    setVolume(SOUND_VOLUME);
    bind();
  }, []);

  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      enableSystem={false}
      disableTransitionOnChange
    >
      <PaletteProvider>
        <SoundCues />
        {children}
      </PaletteProvider>
    </ThemeProvider>
  );
}
