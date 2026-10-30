import { unified } from "unified";
import remarkParse from "remark-parse";
import { POSTS_DIR } from "@/config/paths";
import { extractQuotes } from "@/utils/chunking/extractors/quotes";
import type { PostFrontmatter } from "@/types/post";
import { scanMarkdownDir } from "./markdown";

export interface Quote {
  text: string;
  author: string;
  slug: string;
}

// A blockquote counts when it ends in "— Author" and is short enough for
// the footer. Openings mid-sentence ("...", lowercase) or with nested
// quotation marks are excerpts, not quotes.
const ATTRIBUTED = /^(.{20,160}?)\s*(?:—|―|--|\s-)\s*([A-Z][^.—]{2,60})$/;
const EXCERPT = /^(\.\.\.|…|[a-z])|["“”]/;

const parser = unified().use(remarkParse);
let quotes: Quote[] | undefined;

// Parsed once per process: every sidebar page renders the footer, so a
// static build would otherwise reparse all posts per page.
export function getQuotes(): Quote[] {
  if (quotes) return quotes;
  const seen = new Set<string>();
  quotes = scanMarkdownDir(POSTS_DIR).flatMap(({ slug, data, content }) =>
    extractQuotes(parser.parse(content), {
      frontmatter: data as PostFrontmatter,
      slug,
      fullContent: content,
      currentSection: "",
    }).flatMap(({ content: quote }) => {
      const match = quote.match(ATTRIBUTED);
      if (!match) return [];
      const text = match[1]
        .trim()
        .replace(/^["“]|["”]$/g, "")
        .replace(/,$/, ".");
      if (EXCERPT.test(text) || seen.has(text.toLowerCase())) return [];
      seen.add(text.toLowerCase());
      return [{ text, author: match[2].trim(), slug }];
    })
  );
  return quotes;
}
