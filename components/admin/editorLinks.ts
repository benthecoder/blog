import {
  EditorView,
  Decoration,
  ViewPlugin,
  type DecorationSet,
  type ViewUpdate,
} from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import type { EditorState } from "@codemirror/state";

const webUrl = (raw: string, base: string) => {
  try {
    if (!raw || raw.startsWith("#")) return null;
    const url = new URL(raw.replace(/^<|>$/g, ""), base);
    return ["http:", "https:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
};

/** Resolve a link under the pointer without changing the editor's selection. */
export function editorLinkAt(
  state: EditorState,
  position: number,
  base: string
): string | null {
  const tree = syntaxTree(state);
  let node = tree.resolveInner(position, -1);
  for (let parent: typeof node | null = node; parent; parent = parent.parent) {
    if (
      [
        "Image",
        "InlineCode",
        "FencedCode",
        "CodeBlock",
        "HTMLBlock",
        "CommentBlock",
      ].includes(parent.name)
    )
      return null;
  }
  for (; node.parent; node = node.parent) {
    if (["Link", "Autolink", "LinkReference"].includes(node.name)) {
      const url = node.getChild("URL");
      if (url) return webUrl(state.sliceDoc(url.from, url.to), base);
      const label = node.getChild("LinkLabel");
      const normalize = (text: string) =>
        text.slice(1, -1).trim().replace(/\s+/g, " ").toLowerCase();
      const wanted = label
        ? normalize(state.sliceDoc(label.from, label.to))
        : null;
      if (!wanted) return null;
      let found: string | null = null;
      tree.iterate({
        enter(reference) {
          if (found || reference.name !== "LinkReference") return;
          const key = reference.node.getChild("LinkLabel"),
            target = reference.node.getChild("URL");
          if (
            key &&
            target &&
            normalize(state.sliceDoc(key.from, key.to)) === wanted
          )
            found = webUrl(state.sliceDoc(target.from, target.to), base);
        },
      });
      return found;
    }
  }
  // Plain pasted URLs are useful even without Markdown's angle brackets.
  const line = state.doc.lineAt(position);
  for (const match of line.text.matchAll(/https?:\/\/[^\s<>]+/g)) {
    const raw = match[0].replace(/[.,;!?]+$/, "");
    const start = line.from + match.index!;
    if (position >= start && position <= start + raw.length)
      return webUrl(raw, base);
  }
  return null;
}

function linkDecorations(view: EditorView): DecorationSet {
  const ranges: { from: number; to: number; url: string }[] = [];
  const base = window.location.href;
  syntaxTree(view.state).iterate({
    enter(node) {
      if (!["Link", "Autolink", "LinkReference"].includes(node.name)) return;
      const url = editorLinkAt(view.state, node.from + 1, base);
      if (url) ranges.push({ from: node.from, to: node.to, url });
      return false;
    },
  });
  const text = view.state.doc.toString();
  for (const match of text.matchAll(/https?:\/\/[^\s<>]+/g)) {
    const from = match.index!;
    if (ranges.some((range) => from >= range.from && from < range.to)) continue;
    const raw = match[0].replace(/[.,;!?]+$/, "");
    const url = editorLinkAt(view.state, from + 1, base);
    if (url) ranges.push({ from, to: from + raw.length, url });
  }
  return Decoration.set(
    ranges
      .sort((a, b) => a.from - b.from)
      .map(({ from, to, url }) =>
        Decoration.mark({
          tagName: "a",
          attributes: {
            href: url,
            target: "_blank",
            rel: "noopener noreferrer",
            "data-editor-link": "true",
            title: "⌘/Ctrl-click to open; right-click for browser link actions",
          },
        }).range(from, to)
      )
  );
}

const nativeLinks = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: EditorView) {
      this.decorations = linkDecorations(view);
    }
    update(update: ViewUpdate) {
      if (
        update.docChanged ||
        syntaxTree(update.startState) !== syntaxTree(update.state)
      )
        this.decorations = linkDecorations(update.view);
    }
  },
  { decorations: (plugin) => plugin.decorations }
);

export const editorLinks = [
  nativeLinks,
  EditorView.theme({
    ".cm-editor-link": { color: "inherit" },
    "a[data-editor-link]": {
      color: "inherit",
      textDecoration: "none",
      cursor: "text",
    },
    "a[data-editor-link]:hover": {
      textDecoration: "underline",
      textUnderlineOffset: "3px",
    },
  }),
  EditorView.domEventHandlers({
    click(event) {
      if (
        event.target instanceof Element &&
        event.target.closest("a[data-editor-link]")
      )
        event.preventDefault();
      return false;
    },
    mousedown(event, view) {
      if (event.button !== 0 || !(event.metaKey || event.ctrlKey)) return false;
      const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
      const url =
        pos === null
          ? null
          : editorLinkAt(view.state, pos, window.location.href);
      if (!url) return false;
      event.preventDefault();
      window.open(url, "_blank", "noopener,noreferrer");
      return true;
    },
    mousemove(event, view) {
      const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
      const url =
        pos === null
          ? null
          : editorLinkAt(view.state, pos, window.location.href);
      view.contentDOM.title = url
        ? "⌘/Ctrl-click to open; right-click for browser link actions"
        : "";
      view.contentDOM.style.cursor =
        url && (event.metaKey || event.ctrlKey) ? "pointer" : "";
      return false;
    },
    mouseleave(_event, view) {
      view.contentDOM.title = "";
      view.contentDOM.style.cursor = "";
      return false;
    },
  }),
];
