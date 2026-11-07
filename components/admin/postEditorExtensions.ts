import { EditorView, keymap } from "@codemirror/view";
import { Prec } from "@codemirror/state";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags } from "@lezer/highlight";
import { insertLink, toggleBold, toggleItalic } from "./markdownFormat";

// Prose-style writing surface for the post editor (the wiki editor keeps the
// plain monospace look). Markdown syntax is dimmed so the words read first.
const highlightStyle = HighlightStyle.define([
  { tag: tags.processingInstruction, opacity: "0.35" },
  { tag: tags.url, opacity: "0.45" },
  { tag: tags.heading, fontWeight: "700" },
  { tag: tags.strong, fontWeight: "700" },
  { tag: tags.emphasis, fontStyle: "italic" },
  { tag: tags.quote, fontStyle: "italic", opacity: "0.8" },
  { tag: tags.monospace, fontFamily: "var(--font-mono, monospace)" },
]);

export const postEditorExtensions = [
  syntaxHighlighting(highlightStyle),
  Prec.highest(
    keymap.of([
      { key: "Mod-b", run: toggleBold },
      { key: "Mod-i", run: toggleItalic },
      { key: "Mod-k", run: insertLink },
    ])
  ),
  Prec.high(
    EditorView.theme({
      "&.cm-editor .cm-scroller": {
        fontFamily: "var(--font-serif), serif",
        fontSize: "18px",
        lineHeight: "1.7",
      },
      "&.cm-editor .cm-content": {
        padding: "0 0 40vh",
        minHeight: "50vh",
      },
      "&.cm-editor .cm-line": { padding: "0" },
    })
  ),
];
