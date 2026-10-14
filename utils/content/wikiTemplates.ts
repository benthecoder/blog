import { cache } from "react";
import { WIKI_TEMPLATES_DIR } from "@/config/paths";
import type { WikiTemplate } from "@/types/wiki";
import { scanMarkdownDir } from "./markdown";
import { parseTags } from "./tags";

const BLANK: WikiTemplate = {
  key: "blank",
  label: "Blank",
  category: "",
  tags: "",
  paper: false,
  content: "",
};

/**
 * Templates are Markdown files in `templates/wiki/`, edited like any other
 * note. Frontmatter sets the label, order and the defaults a new page starts
 * with (category, tags, whether to show paper fields); the body is the page.
 */
export const getWikiTemplates = cache(
  function getWikiTemplates(): WikiTemplate[] {
    const templates = scanMarkdownDir(WIKI_TEMPLATES_DIR)
      .map(({ slug, data, content }) => ({
        order: typeof data.order === "number" ? data.order : 100,
        template: {
          key: slug,
          label: typeof data.label === "string" ? data.label : slug,
          category: typeof data.category === "string" ? data.category : "",
          tags: parseTags(data.tags).join(", "),
          paper: data.paper === true,
          content: content.replace(/^\n+/, ""),
        } satisfies WikiTemplate,
      }))
      .sort(
        (a, b) =>
          a.order - b.order || a.template.label.localeCompare(b.template.label)
      )
      .map(({ template }) => template);
    return [BLANK, ...templates.filter((t) => t.key !== BLANK.key)];
  }
);
