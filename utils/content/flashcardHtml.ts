import sanitizeHtml from "sanitize-html";

/** Keep card formatting, but no executable markup, attributes, or local media. */
export function sanitizeFlashcardHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "p",
      "div",
      "span",
      "br",
      "hr",
      "b",
      "strong",
      "i",
      "em",
      "u",
      "s",
      "del",
      "sub",
      "sup",
      "ul",
      "ol",
      "li",
      "blockquote",
      "pre",
      "code",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
    ],
    allowedAttributes: {},
    nonTextTags: [
      "script",
      "style",
      "textarea",
      "option",
      "iframe",
      "svg",
      "math",
    ],
  })
    .replace(/\[(?:sound|anki):[^\]]*\]/g, "")
    .trim();
}
