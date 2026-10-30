import { play } from "cuelume";

// Not data-cuelume-hover: its 150ms throttle is global, so fast sweeps drop
// ticks. Pointer check skips touch, where taps emulate mouseenter.
export function hoverTick() {
  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    play("tick");
  }
}
