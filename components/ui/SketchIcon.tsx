import type { CSSProperties } from "react";

// The hand-drawn SVGs in /public/icons are solid black line art. Rendering
// them as <img> means they can only be inverted for dark mode, never tinted —
// so they're used as alpha masks over a themed background instead, which lets
// them pick up the active palette's ink color.
export function SketchIcon({
  src,
  label,
  className = "",
  style,
}: {
  src: string;
  /** Accessible name. Omit for icons whose meaning is already in nearby text. */
  label?: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={`inline-block bg-ink dark:bg-chalk ${className}`}
      style={{
        WebkitMaskImage: `url("${src}")`,
        maskImage: `url("${src}")`,
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        ...style,
      }}
    />
  );
}

// Intrinsic aspect ratios of the wordmark SVGs, needed because a masked span
// has no intrinsic size the way an <img> does.
export const ENAME_RATIO = "634.91 / 148.2";
export const CNAME_RATIO = "448.27 / 134.14";
