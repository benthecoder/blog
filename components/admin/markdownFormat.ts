import { EditorSelection } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";

export interface TextEdit {
  changes: { from: number; to?: number; insert?: string }[];
  /** Selection in the document after only these changes. */
  anchor: number;
  head: number;
}

/** Wrap the selection in `mark`, or unwrap it when it is already wrapped. */
export function toggleWrap(
  text: string,
  from: number,
  to: number,
  mark: string
): TextEdit {
  const n = mark.length;
  if (text.slice(from - n, from) === mark && text.slice(to, to + n) === mark)
    return {
      changes: [
        { from: from - n, to: from },
        { from: to, to: to + n },
      ],
      anchor: from - n,
      head: to - n,
    };
  if (
    to - from >= 2 * n &&
    text.slice(from, from + n) === mark &&
    text.slice(to - n, to) === mark
  )
    return {
      changes: [
        { from, to: from + n },
        { from: to - n, to },
      ],
      anchor: from,
      head: to - 2 * n,
    };
  return {
    changes: [
      { from, insert: mark },
      { from: to, insert: mark },
    ],
    anchor: from + n,
    head: to + n,
  };
}

const linkPattern = /^\[([^\]]*)\]\([^)]*\)$/;

/** Turn the selection into `[selection](|)`, or a selected link back into its text. */
export function toggleLink(text: string, from: number, to: number): TextEdit {
  const link = linkPattern.exec(text.slice(from, to));
  if (link)
    return {
      changes: [{ from, to, insert: link[1] }],
      anchor: from,
      head: from + link[1].length,
    };
  if (from === to)
    return {
      changes: [{ from, insert: "[]()" }],
      anchor: from + 1,
      head: from + 1,
    };
  return {
    changes: [
      { from, insert: "[" },
      { from: to, insert: "]()" },
    ],
    anchor: to + 3,
    head: to + 3,
  };
}

function apply(
  view: EditorView,
  edit: (from: number, to: number, text: string) => TextEdit
) {
  const text = view.state.doc.toString();
  view.dispatch(
    view.state.changeByRange(({ from, to }) => {
      const result = edit(from, to, text);
      return {
        changes: result.changes,
        range: EditorSelection.range(result.anchor, result.head),
      };
    })
  );
  return true;
}

export const toggleBold = (view: EditorView) =>
  apply(view, (from, to, text) => toggleWrap(text, from, to, "**"));
// Posts write italics with underscores.
export const toggleItalic = (view: EditorView) =>
  apply(view, (from, to, text) => toggleWrap(text, from, to, "_"));
export const insertLink = (view: EditorView) =>
  apply(view, (from, to, text) => toggleLink(text, from, to));
