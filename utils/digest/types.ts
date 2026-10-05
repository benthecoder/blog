/** One saved link, normalised from any source. */
export interface LinkItem {
  url: string;
  title: string;
  savedAt: Date;
  /** Passages quoted from the page. */
  highlights: string[];
  /** Your own reaction. Never generated. */
  take?: string;
  /** Names of the sources that contributed to this item. */
  sources: string[];
}

/**
 * A place links come from. To add one (Readwise, Raindrop, an RSS feed, a
 * JSON file...), implement this in `sources/` and register it in
 * `sources/index.ts`; the weekly and monthly scripts need no changes.
 */
export interface LinkSource {
  name: string;
  /** Items saved on or after `since` and before `until`. */
  fetch(since: Date, until: Date): Promise<Omit<LinkItem, "sources">[]>;
}
