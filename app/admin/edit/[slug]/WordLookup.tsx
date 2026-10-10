"use client";

import { useEffect, useState } from "react";
import type { EditorView, ViewUpdate } from "@codemirror/view";

export type WordSelection = { word: string; x: number; y: number };

/** The selected text when it's a single word, with screen coords under it. */
export function wordSelection(update: ViewUpdate): WordSelection | null {
  const view: EditorView = update.view;
  const { main } = update.state.selection;
  if (main.empty || !view.hasFocus) return null;
  const word = update.state.sliceDoc(main.from, main.to).trim();
  if (!/^[A-Za-z][A-Za-z'-]{0,39}$/.test(word)) return null;
  const coords = view.coordsAtPos(main.to);
  return coords ? { word, x: coords.left, y: coords.bottom } : null;
}

/**
 * A "define" chip under a selected word; clicking it looks the word up in
 * the Mac's built-in dictionary through /api/admin/define (offline).
 */
export function WordLookup({ selection }: { selection: WordSelection }) {
  const [open, setOpen] = useState(false);
  const [definition, setDefinition] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    fetch(`/api/admin/define?word=${encodeURIComponent(selection.word)}`, {
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: { definition: string | null }) => {
        if (data.definition) setDefinition(data.definition);
        else setError("no definition found");
      })
      .catch(() => {
        if (!controller.signal.aborted) setError("lookup failed");
      });
    return () => controller.abort();
  }, [open, selection.word]);

  return (
    <div
      style={{ left: selection.x, top: selection.y + 6 }}
      className="fixed z-40 -translate-x-1/2 text-xs"
      // Keep the editor selection while clicking.
      onMouseDown={(event) => event.preventDefault()}
    >
      {open ? (
        <div className="w-80 max-w-[calc(100vw-24px)] p-3 bg-paper dark:bg-night-raised text-ink dark:text-chalk border border-rule dark:border-night-rule shadow-lg">
          {error ? (
            <p className="text-ink-soft dark:text-chalk-muted">{error}</p>
          ) : !definition ? (
            <p className="text-ink-soft dark:text-chalk-muted">looking up…</p>
          ) : (
            <p className="max-h-64 overflow-y-auto whitespace-pre-line leading-relaxed">
              {/* Bullets in the entry mark senses; give each its own line. */}
              {definition.replace(/ • /g, "\n• ")}
            </p>
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
