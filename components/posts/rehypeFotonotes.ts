// Fotonotes: a GFM footnote whose definition starts with an image is a
// photo note, not a text note. This plugin lifts it out of the endnotes
// section and re-inserts it as a <figure class="fotonote"> right after the
// block containing its reference, so the photo sits next to the text it
// belongs to. globals.css floats it into the right margin on wide screens
// and leaves it as an inline figure everywhere else. Any text after the
// image in the definition becomes the caption. Text-only footnotes are
// untouched and keep rendering as endnotes.
//
// Minimal hast shapes: @types/hast is not a dependency of this repo, and
// the plugin only needs the fields below.
interface HastText {
  type: "text";
  value: string;
}
interface HastElement {
  type: "element";
  tagName: string;
  properties?: Record<string, unknown>;
  children: HastNode[];
}
type HastNode = HastElement | HastText | { type: string };
interface HastParent {
  children: HastNode[];
}
interface HastRoot extends HastParent {
  type: "root";
}

const INLINE_TAGS = new Set([
  "a",
  "abbr",
  "b",
  "cite",
  "code",
  "em",
  "i",
  "mark",
  "small",
  "span",
  "strong",
  "sub",
  "sup",
]);

interface Located {
  node: HastElement;
  parent: HastParent;
  index: number;
}

function isElement(node: HastNode): node is HastElement {
  return node.type === "element";
}

function findAll(
  root: HastParent,
  predicate: (node: HastElement) => boolean
): Located[] {
  const found: Located[] = [];
  const walk = (parent: HastParent) => {
    parent.children.forEach((child, index) => {
      if (!isElement(child)) return;
      if (predicate(child)) found.push({ node: child, parent, index });
      walk(child);
    });
  };
  walk(root);
  return found;
}

function isBackref(node: HastNode): boolean {
  return (
    isElement(node) &&
    node.tagName === "a" &&
    node.properties?.dataFootnoteBackref !== undefined
  );
}

function isBlank(node: HastNode): boolean {
  return node.type === "text" && (node as HastText).value.trim() === "";
}

// Returns the fotonote figure for a footnote <li>, or null when the
// definition doesn't start with an image.
function toFotonote(li: HastElement): HastElement | null {
  const holder =
    li.children.find(
      (child): child is HastElement =>
        isElement(child) && child.tagName === "p"
    ) ?? li;
  const meaningful = holder.children.filter(
    (child) => !isBlank(child) && !isBackref(child)
  );
  const [first, ...rest] = meaningful;
  if (!first || !isElement(first) || first.tagName !== "img") {
    return null;
  }
  const children: HastNode[] = [first];
  const caption = rest.filter((child) => !isBlank(child));
  if (caption.length > 0) {
    children.push({
      type: "element",
      tagName: "figcaption",
      properties: {},
      children: caption,
    });
  }
  return {
    type: "element",
    tagName: "figure",
    properties: { className: ["fotonote"], id: li.properties?.id },
    children,
  };
}

export default function rehypeFotonotes() {
  return (tree: HastRoot) => {
    const sections = findAll(
      tree,
      (node) =>
        node.tagName === "section" &&
        node.properties?.dataFootnotes !== undefined
    );
    if (sections.length === 0) return;

    // Anchor locations shift as figures are inserted, so resolve each
    // reference fresh for every fotonote.
    const insertedAfter = new Map<object, number>();

    for (const section of sections) {
      const lists = findAll(section.node, (node) => node.tagName === "ol");
      for (const list of lists) {
        const items = list.node.children.filter(
          (child): child is HastElement =>
            isElement(child) && child.tagName === "li"
        );
        for (const item of items) {
          const figure = toFotonote(item);
          if (!figure) continue;
          const id = item.properties?.id as string | undefined;
          if (!id) continue;

          const refs = findAll(
            tree,
            (node) =>
              node.tagName === "a" &&
              node.properties?.dataFootnoteRef !== undefined &&
              node.properties?.href === `#${id}`
          );
          if (refs.length === 0) continue;

          for (const ref of refs) {
            const classes =
              (ref.node.properties?.className as string[] | undefined) ?? [];
            ref.node.properties = {
              ...ref.node.properties,
              className: [...classes, "fotonote-ref"],
            };
          }

          // Walk up from the reference past inline wrappers (sup, em, …)
          // to the block that contains it, then insert the figure right
          // after the block.
          let located: Located | null = refs[0];
          while (located && INLINE_TAGS.has(located.node.tagName)) {
            const parentEl = located.parent as HastElement;
            if (!parentEl.tagName) break;
            located = findAll(tree, (node) => node === parentEl)[0] ?? null;
          }
          if (!located) continue;
          const block = located;
          const extra = insertedAfter.get(block.node) ?? 0;
          block.parent.children.splice(block.index + 1 + extra, 0, figure);
          insertedAfter.set(block.node, extra + 1);

          list.node.children = list.node.children.filter(
            (child) => child !== item
          );
        }
        if (
          list.node.children.every(
            (child) => !isElement(child) || child.tagName !== "li"
          )
        ) {
          section.parent.children = section.parent.children.filter(
            (child) => child !== section.node
          );
        }
      }
    }
  };
}
