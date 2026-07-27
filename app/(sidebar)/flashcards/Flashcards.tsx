"use client";

import { useCallback, useEffect, useState } from "react";
import { Shuffle, ChevronLeft, ChevronRight, RotateCw } from "lucide-react";
import type { Flashcard } from "@/types/flashcards";

function shuffledIndices(n: number): number[] {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Scale type to content length so single-word vocab is large and prominent
 * while long paragraphs (e.g. a bible verse) stay readable and fit the card.
 */
function fontSize(html: string): string {
  const len = html
    .replace(/<[^>]*>/g, "")
    .replace(/&[a-z]+;/gi, " ")
    .trim().length;
  if (len <= 16) return "text-4xl sm:text-5xl";
  if (len <= 48) return "text-2xl sm:text-3xl";
  if (len <= 140) return "text-xl sm:text-2xl";
  if (len <= 320) return "text-lg";
  return "text-base";
}

export default function Flashcards({ cards }: { cards: Flashcard[] }) {
  const decks = Array.from(new Set(cards.map((c) => c.deck))).sort();

  const [deck, setDeck] = useState<string>("all");
  const pool = deck === "all" ? cards : cards.filter((c) => c.deck === deck);

  const [order, setOrder] = useState<number[]>(() => cards.map((_, i) => i));
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);

  // Rebuild the ordering when the deck switches — render-time adjustment
  // (react.dev "adjusting state when a prop changes"), no effect needed.
  const [prevDeck, setPrevDeck] = useState(deck);
  if (deck !== prevDeck) {
    setPrevDeck(deck);
    setOrder(pool.map((_, i) => i));
    setPos(0);
    setFlipped(false);
  }

  const card = pool[order[pos]];

  // Stable identities required: these are deps of the keydown effect below
  const go = useCallback(
    (delta: number) => {
      setFlipped(false);
      setPos((p) =>
        order.length ? (p + delta + order.length) % order.length : 0
      );
    },
    [order.length]
  );

  const flip = useCallback(() => setFlipped((f) => !f), []);

  const shuffle = useCallback(() => {
    setFlipped(false);
    setPos(0);
    setOrder(shuffledIndices(pool.length));
  }, [pool.length]);

  const reset = () => {
    setFlipped(false);
    setPos(0);
    setOrder(pool.map((_, i) => i));
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        flip();
      } else if (e.key === "ArrowRight" || e.key === "j") {
        go(1);
      } else if (e.key === "ArrowLeft" || e.key === "k") {
        go(-1);
      } else if (e.key === "s") {
        shuffle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flip, go, shuffle]);

  if (!card) return null;

  const tabBase = "px-3 py-1 rounded-full text-xs transition-colors border";
  const tabOn =
    "border-ink/30 dark:border-chalk/30 text-ink dark:text-chalk bg-ink/6 dark:bg-chalk/8";
  const tabOff =
    "border-transparent text-ink-strong/45 dark:text-chalk-strong/45 hover:text-ink-strong/80 dark:hover:text-chalk-strong/80";

  return (
    <div className="flex flex-col items-center gap-7">
      {/* Deck switcher */}
      {decks.length > 1 && (
        <div className="flex flex-wrap justify-center gap-1.5">
          <button
            onClick={() => setDeck("all")}
            className={`${tabBase} ${deck === "all" ? tabOn : tabOff}`}
          >
            all
            <span className="ml-1 tabular-nums opacity-50">{cards.length}</span>
          </button>
          {decks.map((d) => {
            const count = cards.filter((c) => c.deck === d).length;
            return (
              <button
                key={d}
                onClick={() => setDeck(d)}
                className={`${tabBase} ${deck === d ? tabOn : tabOff}`}
              >
                {d}
                <span className="ml-1 tabular-nums opacity-50">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Progress */}
      <div className="w-full max-w-xl flex items-center gap-3">
        <div className="h-px flex-1 bg-rule dark:bg-night-raised relative overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-ink/40 dark:bg-chalk/40 transition-[width] duration-300"
            style={{ width: `${((pos + 1) / pool.length) * 100}%` }}
          />
        </div>
        <span className="text-xs font-mono tabular-nums text-ink-strong/40 dark:text-chalk-strong/40 shrink-0">
          {pos + 1} / {pool.length}
        </span>
      </div>

      {/* Flip card */}
      <div className="w-full max-w-xl perspective-[1800px]">
        <button
          onClick={flip}
          aria-label="Flip card"
          className="group relative w-full min-h-96 text-left outline-hidden cursor-pointer"
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "none",
            transition: "transform 0.55s cubic-bezier(0.4, 0.0, 0.2, 1)",
          }}
        >
          {/* Front */}
          <div className="absolute inset-0 backface-hidden overflow-y-auto rounded-2xl border border-rule dark:border-night-raised bg-paper-raised dark:bg-night-raised shadow-xs group-hover:shadow-md transition-shadow">
            <div className="min-h-full flex items-center justify-center px-8 py-10">
              <div
                className={`flashcard-body text-center leading-snug text-ink dark:text-chalk-strong ${fontSize(card.front)}`}
                dangerouslySetInnerHTML={{ __html: card.front }}
              />
            </div>
          </div>

          {/* Back */}
          <div className="absolute inset-0 backface-hidden transform-[rotateY(180deg)] overflow-y-auto rounded-2xl border border-ink/20 dark:border-chalk/15 bg-paper dark:bg-night shadow-xs">
            <div className="min-h-full flex items-center justify-center px-8 py-10">
              <div
                className={`flashcard-body text-center leading-snug text-ink dark:text-chalk ${fontSize(card.back)}`}
                dangerouslySetInnerHTML={{ __html: card.back }}
              />
            </div>
          </div>
        </button>
      </div>

      {/* Meta: deck (in multi-deck 'all' view) + tags */}
      {((deck === "all" && decks.length > 1) || card.tags.length > 0) && (
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs text-ink-strong/40 dark:text-chalk-strong/40 -mt-2">
          {deck === "all" && decks.length > 1 && <span>{card.deck}</span>}
          {deck === "all" && decks.length > 1 && card.tags.length > 0 && (
            <span>·</span>
          )}
          {card.tags.map((tag) => (
            <span key={tag} className="font-mono">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => go(-1)}
          aria-label="Previous card"
          className="p-2.5 rounded-full text-ink-strong/50 dark:text-chalk-strong/50 hover:text-ink-strong dark:hover:text-chalk-strong hover:bg-rule/40 dark:hover:bg-night-raised/60 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={flip}
          className="px-5 py-2 mx-1 text-sm rounded-full border border-rule dark:border-night-raised text-ink-strong/80 dark:text-chalk-strong/80 hover:border-ink/40 dark:hover:border-chalk/40 transition-colors"
        >
          flip
        </button>
        <button
          onClick={() => go(1)}
          aria-label="Next card"
          className="p-2.5 rounded-full text-ink-strong/50 dark:text-chalk-strong/50 hover:text-ink-strong dark:hover:text-chalk-strong hover:bg-rule/40 dark:hover:bg-night-raised/60 transition-colors"
        >
          <ChevronRight size={20} />
        </button>
        <span className="mx-2 h-5 w-px bg-rule dark:bg-night-raised" />
        <button
          onClick={shuffle}
          aria-label="Shuffle"
          title="Shuffle (s)"
          className="p-2.5 rounded-full text-ink-strong/50 dark:text-chalk-strong/50 hover:text-ink-strong dark:hover:text-chalk-strong hover:bg-rule/40 dark:hover:bg-night-raised/60 transition-colors"
        >
          <Shuffle size={17} />
        </button>
        <button
          onClick={reset}
          aria-label="Reset order"
          title="Reset order"
          className="p-2.5 rounded-full text-ink-strong/50 dark:text-chalk-strong/50 hover:text-ink-strong dark:hover:text-chalk-strong hover:bg-rule/40 dark:hover:bg-night-raised/60 transition-colors"
        >
          <RotateCw size={16} />
        </button>
      </div>

      <p className="text-[11px] font-mono text-ink-strong/30 dark:text-chalk-strong/30">
        space flip · ← → navigate · s shuffle
      </p>
    </div>
  );
}
