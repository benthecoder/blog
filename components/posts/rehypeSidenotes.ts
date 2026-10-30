// Clones every footnote into an <aside class="sidenote"> after the block
// containing its reference. The endnotes section stays in the document;
// globals.css renders the asides in the margin on wide screens and the
// endnotes otherwise, keeping the canonical section accessible in both.
//
// Minimal hast shapes — @types/hast is not a dependency of this repo.
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

function isBlankText(node: HastNode): boolean {
  return node.type === "text" && (node as HastText).value.trim() === "";
}

// Image-led paragraphs are unwrapped: left wrapped, the pipeline turns
// them into full-bleed photo plates and drops any text after the image.
function sidenoteChildren(li: HastElement): HastNode[] {
  const copy = (nodes: HastNode[]): HastNode[] =>
    nodes.flatMap((node) => {
      if (isBackref(node)) return [];
      if (!isElement(node)) return [{ ...node }];
      return [
        {
          ...node,
          properties: {
            ...node.properties,
            ...(node.tagName === "a" ? { tabIndex: -1 } : {}),
          },
          children: copy(node.children),
        },
      ];
    });
  const cloned = copy(li.children).filter((node) => !isBlankText(node));
  const flattened = cloned.flatMap((node) => {
    if (!isElement(node) || node.tagName !== "p") return [node];
    const kids = node.children.filter((child) => !isBlankText(child));
    const first = kids[0];
    if (first && isElement(first) && first.tagName === "img") return kids;
    return [node];
  });
  const only = flattened[0];
  if (
    flattened.length === 1 &&
    only &&
    isElement(only) &&
    only.tagName === "p"
  ) {
    return only.children;
  }
  return flattened;
}

export default function rehypeSidenotes() {
  return (tree: HastRoot) => {
    const sections = findAll(
      tree,
      (node) =>
        node.tagName === "section" &&
        node.properties?.dataFootnotes !== undefined
    );
    if (sections.length === 0) return;

    // Anchor locations shift as asides are inserted, so resolve each
    // reference fresh for every note.
    const insertedAfter = new Map<HastElement, number>();
    let placed = 0;

    for (const section of sections) {
      const lists = findAll(section.node, (node) => node.tagName === "ol");
      for (const list of lists) {
        const items = list.node.children.filter(
          (child): child is HastElement =>
            isElement(child) && child.tagName === "li"
        );
        items.forEach((item, position) => {
          const id = item.properties?.id as string | undefined;
          if (!id) return;

          const refs = findAll(
            tree,
            (node) =>
              node.tagName === "a" &&
              node.properties?.dataFootnoteRef !== undefined &&
              node.properties?.href === `#${id}`
          );
          if (refs.length === 0) return;

          const number: HastElement = {
            type: "element",
            tagName: "span",
            properties: { className: ["sidenote-number"] },
            children: [{ type: "text", value: String(position + 1) }],
          };
          const aside: HastElement = {
            type: "element",
            tagName: "aside",
            // aria-hidden: the endnote is the canonical copy.
            properties: { className: ["sidenote"], ariaHidden: true },
            children: [number, ...sidenoteChildren(item)],
          };

          // Insert after the block containing the reference.
          let located: Located | null = refs[0];
          while (located && INLINE_TAGS.has(located.node.tagName)) {
            const parentEl = located.parent as HastElement;
            if (!parentEl.tagName) break;
            located = findAll(tree, (node) => node === parentEl)[0] ?? null;
          }
          if (!located) return;
          const extra = insertedAfter.get(located.node) ?? 0;
          located.parent.children.splice(located.index + 1 + extra, 0, aside);
          insertedAfter.set(located.node, extra + 1);
          placed += 1;
        });
      }
    }

    if (placed > 0) {
      for (const section of sections) {
        const classes =
          (section.node.properties?.className as string[] | undefined) ?? [];
        section.node.properties = {
          ...section.node.properties,
          className: [...classes, "has-sidenotes"],
        };
      }
    }
  };
}
