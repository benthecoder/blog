import fs from "fs";
import path from "path";
import type { Metadata } from "next";
import { DATA_DIR } from "@/config/paths";
import type { FlashcardsData } from "@/types/flashcards";
import Flashcards from "./Flashcards";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "flashcards",
  description: "Anki flashcards I'm reviewing, with a flip-to-reveal UI",
};

function loadFlashcards(): FlashcardsData | null {
  const file = path.join(DATA_DIR, "flashcards.json");
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as FlashcardsData;
  } catch {
    return null;
  }
}

const FlashcardsPage = () => {
  const data = loadFlashcards();
  const cards = data?.cards ?? [];
  const deckCount = data?.decks?.length ?? 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-ink-strong dark:text-chalk-strong">
          flashcards
        </h1>
        <p className="text-xs text-ink-strong/50 dark:text-chalk-strong/50 mt-1">
          {cards.length > 0
            ? `${cards.length} ${cards.length === 1 ? "card" : "cards"}` +
              (deckCount > 1 ? ` · ${deckCount} decks` : "") +
              " from anki"
            : "synced from anki"}
        </p>
      </div>

      {cards.length === 0 ? (
        <div className="text-center text-sm text-ink-strong/40 dark:text-chalk-strong/40 space-y-2">
          <p>No cards yet.</p>
          <p className="text-xs font-mono">
            run{" "}
            <code className="text-ink-strong/60 dark:text-chalk-strong/60">
              pnpm sync-anki
            </code>{" "}
            with Anki open
          </p>
        </div>
      ) : (
        <Flashcards cards={cards} />
      )}
    </div>
  );
};

export default FlashcardsPage;
