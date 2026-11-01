import { expect, it } from "vitest";
import { loginDestination } from "./loginDestination";
it("keeps sign-in redirects on the current origin", () => {
  expect(loginDestination("/thoughts/new")).toBe("/thoughts/new");
  expect(loginDestination("/admin/edit/new?draft=true")).toBe(
    "/admin/edit/new?draft=true"
  );
  for (const target of [
    null,
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "javascript:alert(1)",
  ]) {
    expect(loginDestination(target)).toBe("/admin");
  }
});
