import { expect, it } from "vitest";
import { arrowDirection, type ArrowKeyState } from "./postArrowKeys";

const base: ArrowKeyState = {
  key: "ArrowLeft",
  defaultPrevented: false,
  repeat: false,
  modified: false,
  blocked: false,
};

it("maps left/right to prev/next", () => {
  expect(arrowDirection(base)).toBe("prev");
  expect(arrowDirection({ ...base, key: "ArrowRight" })).toBe("next");
  expect(arrowDirection({ ...base, key: "ArrowUp" })).toBeNull();
});

it("ignores handled, repeated, modified and blocked presses", () => {
  for (const override of [
    { defaultPrevented: true },
    { repeat: true },
    { modified: true },
    { blocked: true },
  ]) {
    expect(arrowDirection({ ...base, ...override })).toBeNull();
  }
});
