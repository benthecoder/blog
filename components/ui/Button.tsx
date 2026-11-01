import type { ComponentProps } from "react";
import Link from "next/link";
import { cx } from "./cx";

/**
 * Buttons are styled by roles only (`text-accent`, `border-line`, ...), so the
 * same markup reads correctly in the notebook, washi and darkroom themes.
 * Every primitive carries `focus-ring`: one keyboard treatment everywhere.
 * `data-ui` tells theme CSS (map.css, photos.css) to leave them alone: their
 * unlayered `button { border: 0; padding: 0 }` resets would beat utilities.
 */
type ButtonVariant = "quiet" | "outline" | "solid";
type ButtonSize = "sm" | "md";
type ButtonTone = "default" | "danger";

type StyleOptions = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  tone?: ButtonTone;
  className?: string;
};

const base =
  "focus-ring inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xs border border-transparent transition-colors disabled:cursor-default disabled:opacity-30";

const sizes: Record<ButtonSize, string> = {
  sm: "min-h-11 px-3 text-xs sm:min-h-9",
  md: "min-h-11 px-4 text-sm",
};

const variants: Record<ButtonTone, Record<ButtonVariant, string>> = {
  default: {
    quiet: "text-secondary hover:text-accent",
    outline: "border-line text-accent hover:border-accent",
    solid: "border-accent bg-accent text-surface hover:opacity-90",
  },
  danger: {
    quiet: "text-danger hover:opacity-80",
    outline: "border-danger text-danger hover:bg-danger/10",
    solid: "border-danger bg-danger text-surface hover:opacity-90",
  },
};

export function buttonClass({
  variant = "quiet",
  size = "md",
  tone = "default",
  className,
}: StyleOptions) {
  return cx(base, sizes[size], variants[tone][variant], className);
}

export type ButtonProps = ComponentProps<"button"> &
  Omit<StyleOptions, "className">;

export function Button({
  variant,
  size,
  tone,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      data-ui="button"
      className={buttonClass({ variant, size, tone, className })}
      {...props}
    />
  );
}

export type ButtonLinkProps = ComponentProps<typeof Link> &
  Omit<StyleOptions, "className">;

/** A link that looks like a button. Navigates, so it stays an `<a>`. */
export function ButtonLink({
  variant,
  size,
  tone,
  className,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      data-ui="button"
      className={buttonClass({ variant, size, tone, className })}
      {...props}
    />
  );
}
