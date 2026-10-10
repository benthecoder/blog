"use client";

import { useEffect, useState } from "react";
import type { EditorView, ViewUpdate } from "@codemirror/view";

export type WordSelection = { word: string; x: number; y: number };

type Entries = { definition: string | null; thesaurus: string | null };

/** The selected text when it's a single word, with screen coords above it. */
export function wordSelection(update: ViewUpdate): WordSelection | null {
  const view: EditorView = update.view;
  const { main } = update.state.selection;
  if (main.empty || !view.hasFocus) return null;
  const word = update.state.sliceDoc(main.from, main.to).trim();
  if (!/^[A-Za-z][A-Za-z'-]{0,39}$/.test(word)) return null;
  const coords = view.coordsAtPos(main.to);
  return coords ? { word, x: coords.left, y: coords.top } : null;
}

// Entries come back as one line of text; break senses onto their own lines.
const formatEntry = (text: string) =>
  text
    .replace(/ • /g, "\n• ")
    .replace(/ (\d{1,2}) (?=[a-z])/g, "\n$1 ")
    .replace(/ ANTONYMS /g, "\nantonyms: ");

/**
 * A "define" chip above a selected word; clicking it shows the Mac's
 * built-in dictionary and thesaurus entries side by side, offline.
 */
export function WordLookup({ selection }: { selection: WordSelection }) {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<Entries | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    fetch(`/api/admin/define?word=${encodeURIComponent(selection.word)}`, {
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: Entries) => {
        if (data.definition || data.thesaurus) setEntries(data);
        else setError("no definition found");
      })
      .catch(() => {
        if (!controller.signal.aborted) setError("lookup failed");
      });
    return () => controller.abort();
  }, [open, selection.word]);

  return (
    <div
      style={{ left: selection.x, top: selection.y - 6 }}
      className="fixed z-40 -translate-x-1/2 -translate-y-full text-xs"
      // Keep the editor selection while clicking.
      onMouseDown={(event) => event.preventDefault()}
    >
      {open ? (
        <div
          className={`${entries?.definition && entries.thesaurus ? "w-[36rem] grid grid-cols-2 gap-4" : "w-80"} max-w-[calc(100vw-24px)] p-3 bg-paper dark:bg-night-raised text-ink dark:text-chalk border border-rule dark:border-night-rule shadow-lg`}
        >
          {error ? (
            <p className="text-ink-soft dark:text-chalk-muted">{error}</p>
          ) : !entries ? (
            <p className="text-ink-soft dark:text-chalk-muted">looking up…</p>
          ) : (
            [
              ["dictionary", entries.definition],
              ["thesaurus", entries.thesaurus],
            ].map(
              ([label, text]) =>
                text && (
                  <section key={label} className="min-w-0">
                    <h3 className="mb-1 text-[11px] text-ink-muted dark:text-chalk-muted">
                      {label}
                    </h3>
                    <p className="max-h-64 overflow-y-auto whitespace-pre-line leading-relaxed pr-1 [scrollbar-width:thin] [scrollbar-color:var(--scrollbar-thumb-quiet)_transparent]">
                      {formatEntry(text)}
                    </p>
                  </section>
                )
            )
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="px-2 py-1 rounded-xs bg-paper dark:bg-night-raised border border-rule dark:border-night-rule shadow-sm text-ink-soft dark:text-chalk-muted hover:text-ink dark:hover:text-chalk"
        >
          define
        </button>
      )}
    </div>
  );
}
