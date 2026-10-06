import { StateEffect, StateField } from "@codemirror/state";

export const setImageInsertion = StateEffect.define<number | null>();
// An upload is asynchronous. Keep its insertion point attached to the text
// even if the user edits the document before the upload completes.
export const imageInsertionPoint = StateField.define<number | null>({
  create: () => null,
  update(position, transaction) {
    let next =
      position === null ? null : transaction.changes.mapPos(position, 1);
    for (const effect of transaction.effects) {
      if (effect.is(setImageInsertion)) next = effect.value;
    }
    return next;
  },
});
