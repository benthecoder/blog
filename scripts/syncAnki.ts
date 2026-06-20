/**
 * Sync flashcards from a local Anki deck into public/data/flashcards.json,
 * rendered by the /flashcards page.
 *
 * Requires Anki to be running with the AnkiConnect add-on (code 2055492159).
 * Vercel can't reach your local Anki, so run this locally and commit the
 * resulting JSON:
 *
 *   pnpm sync-anki              # every deck (pick one in the UI)
 *   pnpm sync-anki "My Deck"    # limit to a single deck
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import { DATA_DIR } from "../config/paths";
import { ANKI_CONNECT_URL, ANKI_DECK } from "../config/constants";
import type { Flashcard, FlashcardsData } from "../types/flashcards";

async function ankiConnect<T>(action: string, params: object = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(ANKI_CONNECT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, version: 6, params }),
    });
  } catch {
    throw new Error(
      `Could not reach AnkiConnect at ${ANKI_CONNECT_URL}. ` +
        `Is Anki running with the AnkiConnect add-on installed?`
    );
  }
  if (!res.ok) throw new Error(`AnkiConnect HTTP ${res.status}`);
  const json = (await res.json()) as { result: T; error: string | null };
  if (json.error) throw new Error(`AnkiConnect: ${json.error}`);
  return json.result;
}

/**
 * Anki fields are HTML and may reference local media that isn't served by the
 * blog. Strip scripts/styles, inline event handlers, audio refs, and <img>
 * tags so the remaining markup is safe and self-contained.
 */
function cleanHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/\[sound:[^\]]*\]/g, "")
    .replace(/<img[^>]*>/gi, "")
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son\w+\s*=\s*'[^']*'/gi, "")
    .replace(/\sstyle\s*=\s*"[^"]*"/gi, "") // drop inline colors/fonts; theme owns styling
    .replace(/\sstyle\s*=\s*'[^']*'/gi, "")
    .replace(/\sclass\s*=\s*"[^"]*"/gi, "")
    .replace(/\sclass\s*=\s*'[^']*'/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Anki's rendered `answer` is "front + <hr id=answer> + back". Keep only the
 * back so the flip card doesn't repeat the question.
 */
function extractBack(answerHtml: string): string {
  const parts = answerHtml.split(/<hr[^>]*id=?"?answer"?[^>]*>/i);
  return parts.length > 1 ? parts.slice(1).join("") : answerHtml;
}

interface CardInfo {
  cardId: number;
  question: string;
  answer: string;
  deckName: string;
  note: number;
}

interface NoteInfo {
  noteId: number;
  tags: string[];
}

async function main() {
  // No argument => every deck. Pass a deck name to limit the sync.
  const deckArg = process.argv[2] || process.env.ANKI_DECK;
  const onlyDefault = ANKI_DECK !== "Default" ? ANKI_DECK : undefined;
  const deckFilter = deckArg || onlyDefault;
  const query = deckFilter ? `deck:"${deckFilter}"` : "deck:*";

  console.log(
    `Syncing ${deckFilter ? `deck "${deckFilter}"` : "all decks"} from ${ANKI_CONNECT_URL}...`
  );

  const cardIds = await ankiConnect<number[]>("findCards", { query });
  console.log(`Found ${cardIds.length} cards`);

  let cards: Flashcard[] = [];

  if (cardIds.length > 0) {
    const cardsInfo = await ankiConnect<CardInfo[]>("cardsInfo", {
      cards: cardIds,
    });

    const noteIds = [...new Set(cardsInfo.map((c) => c.note))];
    const notesInfo = await ankiConnect<NoteInfo[]>("notesInfo", {
      notes: noteIds,
    });
    const tagsByNote = new Map(notesInfo.map((n) => [n.noteId, n.tags]));

    cards = cardsInfo
      .map((c) => ({
        id: c.cardId,
        front: cleanHtml(c.question),
        back: cleanHtml(extractBack(c.answer)),
        deck: c.deckName,
        tags: tagsByNote.get(c.note) ?? [],
      }))
      .filter((c) => c.front || c.back);
  }

  const decks = Array.from(new Set(cards.map((c) => c.deck))).sort();

  const output: FlashcardsData = {
    cards,
    count: cards.length,
    decks,
    deck: deckFilter ?? "all",
    generatedAt: new Date().toISOString(),
  };

  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const outputPath = path.join(DATA_DIR, "flashcards.json");
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

  console.log(
    `✓ Wrote ${cards.length} cards across ${decks.length} deck(s) to ${outputPath}`
  );
  console.log("  Commit this file so it ships to production.");
}

main().catch((err: Error) => {
  console.error(`\n✗ Anki sync failed: ${err.message}`);
  process.exit(1);
});
