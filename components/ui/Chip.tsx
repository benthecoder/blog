import type { ComponentProps } from "react";
import { cx } from "./cx";

export type ChipProps = Omit<ComponentProps<"button">, "aria-pressed"> & {
  pressed: boolean;
  /** A quiet tabular number after the label, e.g. how many results. */
  count?: number;
};

/**
 * A toggle for filters. `pressed` is exposed as `aria-pressed`, and the
 * selected look is keyed off that attribute, so what a screen reader hears and
 * what a sighted reader sees cannot drift apart.
 */
export function Chip({
  pressed,
  count,
  className,
  children,
  type = "button",
  ...props
}: ChipProps) {
  return (
    <button
      type={type}
      aria-pressed={pressed}
      data-ui="chip"
      className={cx(
        "focus-ring inline-flex min-h-11 min-w-11 touch-manipulation cursor-pointer select-none items-center justify-center gap-1 border border-line px-2 text-caption text-primary transition-colors hover:border-muted aria-pressed:border-primary aria-pressed:bg-raised disabled:cursor-default disabled:opacity-30 sm:pointer-fine:min-h-6 sm:pointer-fine:min-w-6",
        className
      )}
      {...props}
    >
      {children}
      {count !== undefined && (
        <span className="tabular-nums text-muted">{count}</span>
      )}
    </button>
  );
}
