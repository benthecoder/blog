import {
  createBundledHighlighter,
  createSingletonShorthands,
  guessEmbeddedLanguages,
} from "shiki/core";
import { createOnigurumaEngine } from "shiki/engine/oniguruma";

const c = () => import("shiki/langs/c.mjs");
const cpp = () => import("shiki/langs/cpp.mjs");
const csharp = () => import("shiki/langs/csharp.mjs");
const css = () => import("shiki/langs/css.mjs");
const html = () => import("shiki/langs/html.mjs");
const javascript = () => import("shiki/langs/javascript.mjs");
const markdown = () => import("shiki/langs/markdown.mjs");
const objectiveC = () => import("shiki/langs/objective-c.mjs");
const python = () => import("shiki/langs/python.mjs");
const ruby = () => import("shiki/langs/ruby.mjs");
const typescript = () => import("shiki/langs/typescript.mjs");
const vue = () => import("shiki/langs/vue.mjs");
const yaml = () => import("shiki/langs/yaml.mjs");

// Trace only the grammars and two themes used across posts into the deployment.
const createHighlighter = createBundledHighlighter({
  langs: {
    c,
    "c#": csharp,
    "c++": cpp,
    cpp,
    cs: csharp,
    csharp,
    css,
    html,
    javascript,
    js: javascript,
    markdown,
    md: markdown,
    objc: objectiveC,
    "objective-c": objectiveC,
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
