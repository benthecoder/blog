"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { flip, offset, shift, useFloating } from "@floating-ui/react";
import { animateIn } from "@/components/admin/enterAnimation";
import type { WordSelection } from "@/components/admin/wordBubble";
import {
  entryLines,
  shortDefinition,
  synonymParts,
} from "@/utils/dictionaryEntry";

type Entries = { definition: string | null; thesaurus: string | null };

/**
 * A short definition under a selected word, from the Mac's built-in
 * dictionary. Expanded, it shows the dictionary and thesaurus in two columns
 * and a click on a synonym swaps it in. Collapsed, it never takes focus.
 */
export function DefineBubble({
  selection,
  expanded,
  onSwap,
  onClose,
}: {
  selection: WordSelection;
  expanded: boolean;
  onSwap: (word: string) => void;
  onClose: () => void;
}) {
  const [loaded, setLoaded] = useState<{
    word: string;
    entries: Entries | null;
  } | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/admin/define?word=${encodeURIComponent(selection.word)}`, {
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((entries: Entries) => setLoaded({ word: selection.word, entries }))
      .catch(() => {
        if (!controller.signal.aborted)
          setLoaded({ word: selection.word, entries: null });
      });
    return () => controller.abort();
  }, [selection.word]);
  const entries = loaded?.word === selection.word ? loaded.entries : null;

  const reference = useMemo(
    () => ({
      getBoundingClientRect: () =>
        new DOMRect(
          selection.left,
          selection.top,
          selection.right - selection.left,
          selection.bottom - selection.top
        ),
    }),
    [selection]
  );
  const { refs, floatingStyles } = useFloating({
    placement: "bottom",
    strategy: "fixed",
    middleware: [offset(6), flip(), shift({ padding: 12 })],
  });
  useLayoutEffect(() => {
    refs.setPositionReference(reference);
  }, [reference, refs]);

  const shown = Boolean(entries?.definition || entries?.thesaurus);
  // Entering from nothing animates; moving to another word does not remount.
  const inner = useRef<HTMLDivElement>(null);
  const animated = useRef(false);
  useEffect(() => {
    if (!shown || animated.current || !inner.current) return;
    animated.current = true;
    animateIn(inner.current, {
      from: 0.96,
      duration: 125,
      origin: "50% 0",
    });
  }, [shown]);
  useEffect(() => {
    if (expanded) inner.current?.focus();
  }, [expanded]);

  if (!entries || !shown) return null;
  const columns = [
    ["dictionary", entries.definition],
    ["thesaurus", entries.thesaurus],
  ] as const;

  return (
    <div
      ref={refs.setFloating}
      style={floatingStyles}
      className="z-40 max-w-[calc(100vw-24px)]"
    >
      <div
        ref={inner}
        tabIndex={-1}
        role={expanded ? "group" : undefined}
        aria-label={expanded ? `Entries for ${selection.word}` : undefined}
        // Keep the editor selection and focus while clicking.
        onMouseDown={(event) => {
          if (!expanded) event.preventDefault();
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            onClose();
          }
        }}
        className="bg-raised text-primary shadow-lg rounded-xs outline-none"
      >
        {expanded ? (
          <div
            className={`${entries.definition && entries.thesaurus ? "w-[36rem] max-w-full grid grid-cols-2 gap-6" : "w-80"} p-4 text-xs`}
          >
            {columns.map(
              ([label, text]) =>
                text && (
                  <section key={label} className="min-w-0">
                    <h3 className="mb-1 text-caption text-muted">{label}</h3>
                    <div className="max-h-64 overflow-y-auto leading-relaxed pr-1 admin-scrollbar">
                      {entryLines(text).map((line, index) => (
                        <p key={index}>
                          {label === "thesaurus" &&
                          !line.startsWith("antonyms") &&
                          index > 0
                            ? synonymParts(line).map((part, at) =>
                                part.swappable ? (
                                  <button
                                    key={at}
                                    type="button"
                                    onClick={() => onSwap(part.text)}
                                    className="focus-ring text-accent hover:underline"
                                  >
                                    {part.text}
                                  </button>
                                ) : (
                                  part.text
                                )
                              )
                            : line}
                        </p>
                      ))}
                    </div>
                  </section>
                )
            )}
          </div>
        ) : (
          <p className="max-w-xs px-3 py-2 text-xs leading-snug">
            {shortDefinition(entries.definition ?? entries.thesaurus ?? "")}{" "}
            <span className="text-muted">⌘D</span>
          </p>
        )}
      </div>
    </div>
  );
}
