import { useRef, type PointerEvent } from "react";
import { swipeDirection } from "@/utils/swipe";

type Start = { x: number; y: number; t: number };

// Single-finger touch/pen swipe; a second pointer (pinch) cancels it.
export function useSwipe(onSwipe: (direction: 1 | -1) => void) {
  const pointers = useRef(new Map<number, Start>());
  const cancelled = useRef(false);
  return {
    onPointerDown(event: PointerEvent) {
      if (event.pointerType === "mouse") return;
      if (pointers.current.size > 0) cancelled.current = true;
      else cancelled.current = false;
      const { clientX: x, clientY: y } = event;
      pointers.current.set(event.pointerId, { x, y, t: event.timeStamp });
    },
    onPointerUp(event: PointerEvent) {
      const start = pointers.current.get(event.pointerId);
      pointers.current.delete(event.pointerId);
      if (!start || cancelled.current || pointers.current.size > 0) return;
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      const direction = swipeDirection(dx, dy, event.timeStamp - start.t);
      if (direction) onSwipe(direction);
    },
    onPointerCancel(event: PointerEvent) {
      pointers.current.delete(event.pointerId);
    },
  };
}
