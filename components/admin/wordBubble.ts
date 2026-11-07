import { Prec } from "@codemirror/state";
import {
  keymap,
  ViewPlugin,
  type EditorView,
  type ViewUpdate,
} from "@codemirror/view";

export interface WordSelection {
  word: string;
  from: number;
  to: number;
  /** Screen box of the selected word. */
  left: number;
  right: number;
  top: number;
  bottom: number;
}

const STABLE_MS = 250;

function selectedWord(view: EditorView): WordSelection | null {
  const { main } = view.state.selection;
  if (main.empty || !view.hasFocus) return null;
  const word = view.state.sliceDoc(main.from, main.to);
  if (!/^[A-Za-z][A-Za-z'-]{0,39}$/.test(word)) return null;
  const start = view.coordsAtPos(main.from);
  const end = view.coordsAtPos(main.to);
  if (!start || !end) return null;
  return {
    word,
    from: main.from,
    to: main.to,
    left: start.left,
    right: end.left,
    top: Math.min(start.top, end.top),
    bottom: Math.max(start.bottom, end.bottom),
  };
}

/**
 * Reports a selected single word once the selection has held still, and
 * reports null the moment anything moves. Tab (while a word is offered) and
 * ⌘D ask for the longer entry through `expand`.
 */
export function wordBubble(
  report: (selection: WordSelection | null) => void,
  expand: (selection: WordSelection) => void
) {
  let offered: WordSelection | null = null;
  const offer = (selection: WordSelection | null) => {
    offered = selection;
    report(selection);
  };
  return [
    ViewPlugin.fromClass(
      class {
        timer: ReturnType<typeof setTimeout> | undefined;
        constructor(readonly view: EditorView) {}
        update(update: ViewUpdate) {
          if (
            !update.docChanged &&
            !update.selectionSet &&
            !update.focusChanged
          )
            return;
          clearTimeout(this.timer);
          if (offered) offer(null);
          const { main } = update.state.selection;
          if (main.empty) return;
          // Layout can't be read mid-update.
          this.timer = setTimeout(
            () => offer(selectedWord(this.view)),
            STABLE_MS
          );
        }
        destroy() {
          clearTimeout(this.timer);
        }
      }
    ),
    Prec.highest(
      keymap.of([
        {
          key: "Tab",
          run: () => {
            if (!offered) return false;
            expand(offered);
            return true;
          },
        },
        {
          key: "Mod-d",
          run: (view) => {
            const selection = offered ?? selectedWord(view);
            if (!selection) return false;
            offer(selection);
            expand(selection);
            return true;
          },
        },
      ])
    ),
  ];
}
