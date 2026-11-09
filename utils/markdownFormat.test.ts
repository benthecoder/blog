import { describe, expect, it } from "vitest";
import { EditorState } from "@codemirror/state";
import {
  toggleLink,
  toggleWrap,
  type TextEdit,
} from "@/components/admin/markdownFormat";

// Apply an edit; | marks an empty selection, [ ] marks a range.
function run(text: string, edit: TextEdit) {
  const next = EditorState.create({ doc: text }).update({
    changes: edit.changes,
    selection: { anchor: edit.anchor, head: edit.head },
  }).state;
  const doc = next.doc.toString();
  const { from, to } = next.selection.main;
  return from === to
    ? doc.slice(0, from) + "|" + doc.slice(from)
    : doc.slice(0, from) + "[" + doc.slice(from, to) + "]" + doc.slice(to);
}

describe("toggleWrap", () => {
  it("wraps a selection and keeps it selected", () => {
    expect(run("a word b", toggleWrap("a word b", 2, 6, "**"))).toBe(
      "a **[word]** b"
    );
  });
  it("inserts a pair with the cursor inside on an empty selection", () => {
    expect(run("ab", toggleWrap("ab", 1, 1, "_"))).toBe("a_|_b");
  });
  it("unwraps when the marks surround the selection", () => {
    expect(run("a **word** b", toggleWrap("a **word** b", 4, 8, "**"))).toBe(
      "a [word] b"
    );
  });
  it("unwraps when the marks are inside the selection", () => {
    expect(run("a _word_ b", toggleWrap("a _word_ b", 2, 8, "_"))).toBe(
      "a [word] b"
    );
  });
  it("removes an empty pair around the cursor", () => {
    expect(run("a****b", toggleWrap("a****b", 3, 3, "**"))).toBe("a|b");
  });
});

describe("toggleLink", () => {
  it("wraps a selection with the cursor in the url", () => {
    expect(run("see docs now", toggleLink("see docs now", 4, 8))).toBe(
      "see [docs](|) now"
    );
  });
  it("inserts an empty link with the cursor in the text", () => {
    expect(run("x", toggleLink("x", 1, 1))).toBe("x[|]()");
  });
  it("turns a selected link back into its text", () => {
    const text = "a [b](u) c";
    expect(run(text, toggleLink(text, 2, 8))).toBe("a [b] c");
  });
});
