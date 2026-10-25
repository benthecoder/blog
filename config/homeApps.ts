// The home screen: every section of the site as an app on an e-ink "device".
// `icon` keys into components/home/AppIcons. Order is reading order on the
// grid (the sketch widget takes the first 2×2 block), so related apps sit
// together: writing → reading → seeing → making → about the site.

export type HomeApp = {
  label: string;
  href: string;
  icon: string;
  /** One line for the tooltip and for screen readers' description. */
  hint: string;
};

export const HOME_APPS: readonly HomeApp[] = [
  {
    label: "writing",
    href: "/posts",
    icon: "writing",
    hint: "every post, newest first",
  },
  {
    label: "essays",
    href: "/essays",
    icon: "essays",
    hint: "long-form essays",
  },
  {
    label: "thoughts",
    href: "/thoughts",
    icon: "thoughts",
    hint: "stream of consciousness",
  },
  {
    label: "wiki",
    href: "/wiki",
    icon: "wiki",
    hint: "things i've written up",
  },
  {
    label: "papers",
    href: "/papers",
    icon: "papers",
    hint: "papers i've read, with notes",
  },
  {
    label: "library",
    href: "/library",
    icon: "library",
    hint: "books i've read",
  },
  {
    label: "flashcards",
    href: "/flashcards",
    icon: "flashcards",
    hint: "anki cards i'm reviewing",
  },
  {
    label: "curius",
    href: "/curius",
    icon: "curius",
    hint: "links i've saved",
  },
  {
    label: "photos",
    href: "/photos",
    icon: "photos",
    hint: "every photo, by month",
  },
  {
    label: "places",
    href: "/map",
    icon: "places",
    hint: "a map of places i've been",
  },
  {
    label: "recipes",
    href: "/recipes",
    icon: "recipes",
    hint: "things i cook",
  },
  { label: "wave", href: "/wave", icon: "wave", hint: "the wave" },
  {
    label: "projects",
    href: "/projects",
    icon: "projects",
    hint: "things i've built",
  },
  { label: "now", href: "/now", icon: "now", hint: "what i'm up to now" },
  { label: "hn", href: "/hn", icon: "hn", hint: "hacker news, quietly" },
  { label: "uses", href: "/uses", icon: "uses", hint: "what i use" },
  { label: "start", href: "/start", icon: "start", hint: "start here" },
  { label: "tags", href: "/tags", icon: "tags", hint: "posts by topic" },
  {
    label: "colophon",
    href: "/colophon",
    icon: "colophon",
    hint: "how this site is made",
  },
  { label: "rss", href: "/api/rss", icon: "rss", hint: "subscribe by rss" },
];

// Pinned to the bottom of the screen, like a phone's dock.
export const DOCK_APPS: readonly HomeApp[] = [
  {
    label: "search",
    href: "/search",
    icon: "search",
    hint: "search everything",
  },
  { label: "random", href: "/random", icon: "random", hint: "a random post" },
  { label: "about", href: "/about", icon: "about", hint: "about me" },
  {
    label: "find me",
    href: "/contact",
    icon: "contact",
    hint: "where to find me",
  },
];

// Cells the sketch widget occupies (2 columns × 2 rows).
export const WIDGET_CELLS = 4;
