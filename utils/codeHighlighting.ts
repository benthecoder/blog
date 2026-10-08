import {
  createBundledHighlighter,
  createSingletonShorthands,
  guessEmbeddedLanguages,
} from "shiki/core";
import { bundledLanguages } from "shiki/langs";
import { createOnigurumaEngine } from "shiki/engine/oniguruma";

// Keep every language and Shiki's lazy singleton, but trace only the two
// themes used by MarkdownContent into the deployment.
const createHighlighter = createBundledHighlighter({
  langs: bundledLanguages,
  themes: {
    "one-light": () => import("@shikijs/themes/one-light"),
    dracula: () => import("@shikijs/themes/dracula"),
  },
  engine: () => createOnigurumaEngine(import("shiki/wasm")),
});

export const { codeToHtml } = createSingletonShorthands(createHighlighter, {
  guessEmbeddedLanguages,
});
