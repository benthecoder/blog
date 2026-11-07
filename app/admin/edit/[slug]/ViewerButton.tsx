import type { ButtonHTMLAttributes } from "react";

/**
 * Plain text control for the photo viewer. It sits on the dim scrim, which is
 * dark in both modes, so it uses chalk rather than the page's role colors.
 */
export function ViewerButton({
  pressed,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { pressed?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      // Clicking must not steal focus from the viewer, or Enter would
      // re-press the button instead of inserting.
      onMouseDown={(event) => event.preventDefault()}
      className={`min-h-9 px-2 text-sm lowercase text-chalk-strong underline-offset-4 transition-transform duration-100 hover:underline disabled:no-underline disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chalk motion-safe:active:scale-[0.97] ${pressed ? "underline" : ""} ${className}`}
      {...props}
    />
  );
}
