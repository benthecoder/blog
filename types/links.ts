/**
 * Primitives for the manual `[[wikilink]]` knowledge graph.
 *
 * The mental model, top to bottom:
 *   ContentRef     identity of a linkable page      (the atom)
 *   LinkableEntry  a page you can link TO           (ref + how to show/reach it)
 *   ParsedLink     a `[[...]]` occurrence           (pure syntax, unresolved)
 *   ResolvedLink   a ParsedLink pointed at a ref    (or null when unresolved)
 *   LinkGraph      every arrow, plus backlinks      (derived from the above)
 */

export type ContentKind = "wiki" | "post";

/** Identity of any linkable page. Everything else is defined in terms of this. */
export interface ContentRef {
  kind: ContentKind;
  slug: string;
}

/** A page that can be the target of a link. */
export interface LinkableEntry {
  ref: ContentRef;
  title: string;
  /** Route to the page, e.g. `/wiki/kalman-filter` or `/posts/070226`. */
  href: string;
}

/** A `[[target]]` / `[[target|label]]` occurrence — syntax only, no resolution. */
export interface ParsedLink {
  /** Text inside the brackets before any `|`, e.g. `Kalman filter`. */
  target: string;
  /** What to display: the part after `|`, or `target` when there is none. */
  label: string;
}

/** A ParsedLink after resolution against the link index. */
export interface ResolvedLink extends ParsedLink {
  /** The page this points at, or `null` when no page matches (not yet written). */
  entry: LinkableEntry | null;
}

/** Resolves a raw link target to a page. Title-first, slug fallback. */
export type Resolver = (target: string) => LinkableEntry | null;

/** Directed link graph over content, with derived reverse adjacency. */
export interface LinkGraph {
  /** Pages this page links out to. */
  outlinks(ref: ContentRef): LinkableEntry[];
  /** Pages that link to this page ("linked from"). */
  backlinks(ref: ContentRef): LinkableEntry[];
}
