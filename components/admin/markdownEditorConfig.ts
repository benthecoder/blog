import { EditorView, keymap } from "@codemirror/view";
import { Prec } from "@codemirror/state";
import { markdown, markdownKeymap } from "@codemirror/lang-markdown";
import { indentWithTab } from "@codemirror/commands";

// Shared by post and wiki editors; stable extensions preserve undo history.
export const markdownEditorExtensions = [
  markdown({ extensions: { remove: ["SetextHeading"] } }),
  EditorView.lineWrapping,
  Prec.highest(
    keymap.of([
      {
        key: "Escape",
        run: (view) => {
          view.contentDOM.blur();
          return true;
        },
      },
      indentWithTab,
      ...markdownKeymap,
    ])
  ),
  EditorView.theme({
    "&": { backgroundColor: "transparent", height: "100%" },
    ".cm-content": {
      padding: "1rem",
      caretColor: "currentColor",
      fontFamily: "inherit",
      fontSize: "inherit",
    },
    ".cm-scroller": {
      fontFamily: "inherit",
      scrollbarWidth: "thin",
      scrollbarColor: "var(--scrollbar-thumb-quiet) transparent",
    },
    ".cm-scroller:hover": {
      scrollbarColor: "var(--scrollbar-thumb) transparent",
    },
    "&.cm-focused": { outline: "none" },
  }),
];

export const markdownEditorSetup = {
  lineNumbers: false,
  foldGutter: false,
  highlightActiveLine: false,
  highlightActiveLineGutter: false,
  highlightSelectionMatches: false,
  // Avoid auto-pairing apostrophes and quotes in prose.
  closeBrackets: false,
};
