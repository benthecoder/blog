import {
  createBundledHighlighter,
  createSingletonShorthands,
  guessEmbeddedLanguages,
} from "shiki/core";
import { createOnigurumaEngine } from "shiki/engine/oniguruma";

const css = () => import("shiki/langs/css.mjs");
const html = () => import("shiki/langs/html.mjs");
const javascript = () => import("shiki/langs/javascript.mjs");
const markdown = () => import("shiki/langs/markdown.mjs");
const python = () => import("shiki/langs/python.mjs");
const ruby = () => import("shiki/langs/ruby.mjs");
const typescript = () => import("shiki/langs/typescript.mjs");
const vue = () => import("shiki/langs/vue.mjs");
const yaml = () => import("shiki/langs/yaml.mjs");

// Trace only the grammars and two themes used across posts into the deployment.
const createHighlighter = createBundledHighlighter({
  langs: {
    css,
    html,
    javascript,
    js: javascript,
    markdown,
    md: markdown,
    py: python,
    python,
    rb: ruby,
    ruby,
    ts: typescript,
    typescript,
    vue,
    yaml,
    yml: yaml,
  },
  themes: {
    "one-light": () => import("@shikijs/themes/one-light"),
    dracula: () => import("@shikijs/themes/dracula"),
  },
  engine: () => createOnigurumaEngine(import("shiki/wasm")),
});

export const { codeToHtml } = createSingletonShorthands(createHighlighter, {
  guessEmbeddedLanguages,
});
