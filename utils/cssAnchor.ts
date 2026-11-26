/**
 * CSS anchor positioning: one element can be pinned to another with
 * `anchor-name` / `position-anchor`, without measuring it in JavaScript.
 * @see https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_anchor_positioning
 */
export function supportsCssAnchorPositioning(
  supports?: (property: string, value: string) => boolean
): boolean {
  const check = supports ?? globalThis.CSS?.supports;
  return typeof check === "function" && check("anchor-name", "--a");
}

/** Dashed ident used as both `anchor-name` on an icon and `position-anchor` on the label. */
export function navAnchorName(id: string): `--${string}` {
  return `--site-nav-${id}`;
}

/**
 * Dashed ident for a post-preview trigger. `id` is sanitized because React
 * `useId()` may include characters that are illegal in a CSS ident (`:`).
 */
export function postPreviewAnchorName(id: string): `--${string}` {
  const safe = id.replace(/[^a-zA-Z0-9_-]+/g, "") || "x";
  return `--post-preview-${safe}`;
}

/** Pause before hiding so a move to the next target can keep the same element mounted and glide. */
export const ANCHOR_TOOLTIP_HIDE_MS = 120;
