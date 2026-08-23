import { visit, SKIP } from "unist-util-visit";
import type { Root, Text, Link, PhrasingContent } from "mdast";
import { splitOnWikiLinks } from "@/utils/links/parse";

/**
 * Sentinel URL scheme for an unresolved `[[wikilink]]`. The target is
 * percent-encoded after the colon; the render layer (`MarkdownContent`'s `a`
 * handler) decodes it and resolves it against the link index. Keeping the
 * plugin resolution-free is deliberate — see the plan's "sentinel-url" note.
 */
export const WIKILINK_SCHEME = "wikilink:";

export function encodeWikiLinkHref(target: string): string {
  return WIKILINK_SCHEME + encodeURIComponent(target);
}

export function decodeWikiLinkHref(href: string): string | null {
  if (!href.startsWith(WIKILINK_SCHEME)) return null;
  return decodeURIComponent(href.slice(WIKILINK_SCHEME.length));
}

/**
 * Remark plugin: rewrite `[[target]]` / `[[target|label]]` in text into link
 * nodes carrying the `wikilink:` sentinel URL. Pure syntax only — no fs, no
 * resolution. Visiting `text` nodes means code spans and fenced code (whose
 * content lives in `value`, not child text nodes) are skipped automatically.
 */
export default function remarkWikiLink() {
  return (tree: Root) => {
    visit(tree, "text", (node: Text, index, parent) => {
      if (index === undefined || !parent) return;

      const segments = splitOnWikiLinks(node.value);
      const hasLink = segments.some((s) => s.type === "link");
      if (!hasLink) return;

      const replacement: PhrasingContent[] = segments.map((segment) => {
        if (segment.type === "text") {
          return { type: "text", value: segment.value } satisfies Text;
        }
        const link: Link = {
          type: "link",
          url: encodeWikiLinkHref(segment.link.target),
          title: null,
          children: [{ type: "text", value: segment.link.label }],
        };
        return link;
      });

      parent.children.splice(index, 1, ...replacement);
      // Skip past the nodes we just inserted so they aren't re-visited.
      return [SKIP, index + replacement.length];
    });
  };
}
