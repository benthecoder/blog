import { EditorState } from "@codemirror/state";
import { describe, expect, it } from "vitest";
import {
  imageInsertionPoint,
  setImageInsertion,
} from "@/components/admin/imageInsertion";

describe("asynchronous image insertion", () => {
  it("keeps the drop position attached while the document changes", () => {
    let state = EditorState.create({
      doc: "first\nlast",
      extensions: [imageInsertionPoint],
    });
    state = state.update({ effects: setImageInsertion.of(6) }).state;
    state = state.update({ changes: { from: 0, insert: "preface\n" } }).state;
    expect(state.field(imageInsertionPoint)).toBe(14);
    state = state.update({ selection: { anchor: 0 } }).state;
    expect(state.field(imageInsertionPoint)).toBe(14);
    state = state.update({
      changes: { from: 0, to: 14, insert: "short\n" },
    }).state;
    expect(state.field(imageInsertionPoint)).toBe(6);
    state = state.update({ effects: setImageInsertion.of(null) }).state;
    expect(state.field(imageInsertionPoint)).toBeNull();
  });
});
