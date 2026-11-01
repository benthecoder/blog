import { unified } from "unified";
import remarkParse from "remark-parse";

const parser = unified().use(remarkParse);
const linksLabel = /^(?:#{1,6}[ \t]+)?(?:[-*][ \t]+)?links[ \t]*:?[ \t]*$/i;
const followingLabel =
  /^(?:[-*][ \t]+)?(?:wake|sleep|mood|meals|grateful for|til|quote)[ \t]*:/i;
const dailyLog = /^\s*(?:[-*][ \t]+)?(?:wake|sleep|mood|meals)[ \t]*:/i;

/** Move a links section ahead of the daily-log divider to the end, without rewriting it. */
export function linksAtBottom(body: string): string {
  const nodes = parser.parse(body).children;
  for (let index = 0; index < nodes.length; index++) {
    const node = nodes[index];
    if (!["paragraph", "heading", "list"].includes(node.type)) continue;
    const start = node.position?.start.offset;
    const end = node.position?.end.offset;
    if (start === undefined || end === undefined) continue;
    const firstLine = body.slice(start, end).split(/\r?\n/, 1)[0];
    if (!linksLabel.test(firstLine)) continue;
    for (const following of nodes.slice(index + 1)) {
      // A distinct heading starts a new section; do not move it with the links.
      if (following.type === "heading") break;
      if (following.type === "paragraph") {
        const boundary = following.position?.start.offset;
        if (
          boundary !== undefined &&
          followingLabel.test(body.slice(boundary))
        ) {
          const newline = body.includes("\r\n") ? "\r\n" : "\n";
          return (
            [
              body.slice(0, start).trimEnd(),
              body.slice(boundary).trimEnd(),
              body.slice(start, boundary).trimEnd(),
            ]
              .filter(Boolean)
              .join(newline + newline) + newline
          );
        }
      }
      if (following.type !== "thematicBreak") continue;
      const divider = following.position?.start.offset;
      const dividerEnd = following.position?.end.offset;
      if (divider === undefined || dividerEnd === undefined) break;
      if (!dailyLog.test(body.slice(dividerEnd))) break;
      const before = body.slice(0, start).trimEnd();
      const links = body.slice(start, divider).trimEnd();
      const rest = body.slice(divider).trimEnd();
      const newline = body.includes("\r\n") ? "\r\n" : "\n";
      return (
        [before, rest, links].filter(Boolean).join(newline + newline) + newline
      );
    }
  }
  return body;
}

/** Curated Sunday Links are the article, not the daily-log footer. */
export function sundayLinksBeforeDailyLog(body: string): string {
  const nodes = parser.parse(body).children;
  const heading = nodes.find(
    (node) =>
      node.type === "heading" &&
      /^#{1,3}[ \t]+sunday links(?:[ \t]+#\d+)?[ \t]*$/i.test(
        body.slice(node.position!.start.offset!, node.position!.end.offset!)
      )
  );
  const start = heading?.position?.start.offset;
  if (start === undefined) return body;
  const divider = nodes.find(
    (node) =>
      node.type === "thematicBreak" &&
      node.position!.start.offset! < start &&
      dailyLog.test(body.slice(node.position!.end.offset!))
  );
  if (!divider) return body;
  const footerStart = divider.position!.start.offset!;
  const before = body.slice(0, footerStart).trimEnd();
  const footer = body.slice(footerStart, start).trimEnd();
  const links = body.slice(start).trimEnd();
  return [before, links, footer].filter(Boolean).join("\n\n") + "\n";
}
