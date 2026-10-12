import { Parser } from "htmlparser2";
import sanitizeHtml from "sanitize-html";

/** Plain text for labels and measurements; never insert the result as HTML. */
export function htmlText(html: string): string {
  let text = "";
  const parser = new Parser({
    ontext(value) {
      text += value;
    },
  });
  parser.end(sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} }));
  return text;
}
