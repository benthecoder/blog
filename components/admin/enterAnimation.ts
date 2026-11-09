/**
 * Plays a short enter on a freshly mounted element: it scales up from
 * `origin` (a point in the element's own box) while fading in. Under
 * prefers-reduced-motion only the opacity changes.
 */
export function animateIn(
  element: HTMLElement,
  {
    from,
    duration,
    origin,
    easing = "ease-out",
  }: { from: number; duration: number; origin: string; easing?: string }
) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  element.style.transformOrigin = origin;
  element.animate(
    [
      { opacity: 0, transform: reduced ? "none" : `scale(${from})` },
      { opacity: 1, transform: "none" },
    ],
    { duration, easing }
  );
}
