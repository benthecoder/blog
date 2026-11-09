import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { messageEmail } from "./notify";

describe("messageEmail", () => {
  it("names the sender in the subject and signs the body", () => {
    const { subject, text } = messageEmail("hello", "ana, lisbon");
    expect(subject).toBe("new message from ana, lisbon");
    expect(text).toContain("hello\n\n— ana, lisbon");
  });

  it("keeps a multi-line sender to one subject line", () => {
    expect(messageEmail("hi", "ana\nBcc: x@y.z").subject).toBe(
      "new message from ana Bcc: x@y.z"
    );
  });

  it("falls back when anonymous", () => {
    expect(messageEmail("hi", null).subject).toBe("new message from someone");
  });
});
