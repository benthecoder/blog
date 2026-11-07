import type { ComponentProps } from "react";
import { cx } from "./cx";

type Tone = "default" | "danger";

export type IconButtonProps = Omit<ComponentProps<"button">, "aria-label"> & {
  /** Icon-only controls have no text, so the name is required. */
  "aria-label": string;
  size?: "sm" | "md";
  tone?: Tone;
};

const sizes = {
  sm: "min-h-11 min-w-11 p-1.5 sm:pointer-fine:min-h-6 sm:pointer-fine:min-w-6",
  md: "min-h-11 min-w-11",
};

const tones: Record<Tone, string> = {
  default: "text-secondary hover:bg-primary/10 hover:text-accent",
  danger: "text-danger hover:bg-danger/10",
};

export function IconButton({
  size = "md",
  tone = "default",
  className,
  type = "button",
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      data-ui="icon-button"
      className={cx(
        "focus-ring inline-flex touch-manipulation cursor-pointer items-center justify-center rounded-sm transition-[color,background-color,opacity,scale] duration-150 ease-out motion-safe:active:scale-[0.97] disabled:cursor-default disabled:opacity-30",
        sizes[size],
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
