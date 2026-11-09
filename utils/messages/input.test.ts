import { describe, expect, it } from "vitest";
import { MESSAGE_MAX_LENGTH, messageInputSchema } from "./input";

describe("messageInputSchema", () => {
  it("trims the note and stores an empty sender as null", () => {
    expect(
      messageInputSchema.parse({ body: "  hello  ", sender: "   " })
    ).toEqual({ body: "hello", sender: null, website: "" });
  });

  it("keeps a sender", () => {
    expect(
      messageInputSchema.parse({ body: "hi", sender: " ana, lisbon " }).sender
    ).toBe("ana, lisbon");
  });

  it("rejects an empty or whitespace-only note", () => {
    expect(messageInputSchema.safeParse({ body: "   " }).success).toBe(false);
    expect(messageInputSchema.safeParse({}).success).toBe(false);
  });

  it("rejects a note over the limit", () => {
    expect(
      messageInputSchema.safeParse({
        body: "a".repeat(MESSAGE_MAX_LENGTH + 1),
      }).success
    ).toBe(false);
  });
});
