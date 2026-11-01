import { expect, it } from "vitest";
import { highlightExcerpt } from "./highlightExcerpt";
it("keeps complete sentences including abbreviations, rather than cutting at 25 words", () => {
  expect(
    highlightExcerpt(
      "Mozart had a pet common starling which could sing part of his Piano Concerto in G Major (KV. 453).[132] He had bought it from a shop."
    )
  ).toBe(
    "Mozart had a pet common starling which could sing part of his Piano Concerto in G Major (KV. 453)."
  );
  const sentence =
    "When I saw those shelves crammed with hundreds, thousands of cans, cartons and goods of every possible sort, for the first time I felt quite frankly sick with despair for the Soviet people.";
  expect(highlightExcerpt(sentence + " Another sentence.")).toBe(sentence);
});
it("handles Chinese punctuation and preserves a saved fragment without inventing an ending", () => {
  expect(highlightExcerpt("昔者莊周夢為胡蝶。下一句。")).toBe(
    "昔者莊周夢為胡蝶。"
  );
  expect(highlightExcerpt("a saved phrase without punctuation")).toBe(
    "a saved phrase without punctuation"
  );
});
