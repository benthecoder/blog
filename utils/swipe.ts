// Direction of a finished touch gesture: 1 = next (swipe left), -1 = previous.
export function swipeDirection(dx: number, dy: number, ms: number) {
  if (ms > 600 || Math.abs(dx) < 50 || Math.abs(dx) <= 1.5 * Math.abs(dy)) {
    return 0;
  }
  return dx < 0 ? 1 : -1;
}
