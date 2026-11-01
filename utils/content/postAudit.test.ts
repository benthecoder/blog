import { expect, it } from "vitest";
import {
  auditDecisionSchema,
  auditedMetadata,
  postBodyHash,
} from "./postAudit";

const content = "exact body without a trailing newline";
const decision = auditDecisionSchema.parse({
  id: "published/241024",
  format: "essay",
  tags: ["writing", "self-reflection"],
  locations: ["Taipei"],
  bodyHash: postBodyHash(content),
  reason: "Reviewed original reflection and destination",
  needsReview: false,
});

it("changes only audited metadata, preserving dates, titles, and other fields", () => {
  const date = "Oct 24, 2024";
  const result = auditedMetadata(
    "241024",
    { title: "unchanged", date, description: "also unchanged", tags: ["life"] },
    content,
    decision
  );
  expect(result.data).toEqual({
    title: "unchanged",
    date,
    description: "also unchanged",
    tags: ["writing", "self-reflection"],
    format: "essay",
    locations: ["Taipei"],
  });
  expect(
    auditedMetadata("241024", result.data, content, decision).changed
  ).toBe(false);
});

it("refuses stale bodies and unsafe paths before writing", () => {
  expect(() =>
    auditedMetadata(
      "241024",
      { title: "t", date: "Oct 24, 2024" },
      "edited after review",
      decision
    )
  ).toThrow("body changed since review");
  expect(() =>
    auditDecisionSchema.parse({ ...decision, id: "published/../../secret" })
  ).toThrow();
});

it("removes wrong classifications and keeps date-based journal defaults implicit", () => {
  expect(
    auditedMetadata(
      "241024",
      {
        title: "t",
        date: "Oct 24, 2024",
        format: "book",
        locations: ["guessed"],
      },
      content,
      { ...decision, format: "journal", locations: [] }
    ).data
  ).toEqual({
    title: "t",
    date: "Oct 24, 2024",
    tags: "writing, self-reflection",
  });
});
