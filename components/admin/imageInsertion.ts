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

/**
 * Pads a block snippet (an image) with only the newlines it needs to sit in
 * its own paragraph, given the text on either side of the insertion point.
 */
export function asBlock(snippet: string, before: string, after: string) {
  const pad = (run: string) => "\n".repeat(Math.max(0, 2 - run.length));
  const lead = before === "" ? "" : pad(before.match(/\n*$/)![0]);
  const trail = after === "" ? "\n" : pad(after.match(/^\n*/)![0]);
  return lead + snippet + trail;
}
