import { describe, expect, it } from "vitest";
import { draftQueue, nextDraft } from "./adminDraftQueue";

const posts = [
  { slug: "030326", title: "third", date: "Mar 3, 2026", isDraft: true },
  { slug: "020326", title: "published", date: "Mar 2, 2026", isDraft: false },
  { slug: "010326", title: "first", date: "Mar 1, 2026", isDraft: true },
];
describe("draft catch-up queue", () => {
  it("includes pending drafts only, ordered oldest first without mutating the calendar input", () => {
    expect(draftQueue(posts).map((post) => post.slug)).toEqual([
      "010326",
      "030326",
    ]);
    expect(posts[0].slug).toBe("030326");
  });
  it("skips published days when continuing from an open draft", () => {
    expect(nextDraft(draftQueue(posts), "010326", "Mar 1, 2026")?.slug).toBe(
      "030326"
    );
  });
  it("continues forward after publishing removes the current draft from the queue", () => {
    expect(nextDraft(draftQueue(posts), "020326", "Mar 2, 2026")?.slug).toBe(
      "030326"
    );
  });
  it("returns to remaining earlier work after reaching the end", () => {
    expect(nextDraft(draftQueue(posts), "030326", "Mar 3, 2026")?.slug).toBe(
      "010326"
    );
  });
  it("never navigates back to the same final draft", () => {
    expect(
      nextDraft(draftQueue(posts.slice(0, 1)), "030326", "Mar 3, 2026")
    ).toBeUndefined();
    expect(nextDraft([], "030326", "Mar 3, 2026")).toBeUndefined();
  });
});
