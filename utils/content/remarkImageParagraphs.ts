import type { Paragraph, PhrasingContent, Root, RootContent } from "mdast";
import { SKIP, visit } from "unist-util-visit";

// Image-led paragraphs become photo plates. Isolate each image so the
// plate renderer cannot discard the rest of the paragraph.
export default function remarkImageParagraphs() {
  return (tree: Root) => {
    const definitions = new Set<string>();
    visit(tree, "definition", (node) => {
      definitions.add(node.identifier);
    });
    const isImage = (node?: PhrasingContent) =>
      node?.type === "image" ||
      (node?.type === "imageReference" && definitions.has(node.identifier));

    visit(tree, "paragraph", (node, index, parent) => {
      if (
        node.children.length < 2 ||
        !isImage(node.children[0]) ||
        index === undefined ||
        !parent
      )
        return;

      const paragraphs: Paragraph[] = [];
      let text: PhrasingContent[] = [];
      const flush = () => {
        if (text.some((child) => child.type !== "text" || child.value.trim())) {
          paragraphs.push({ type: "paragraph", children: text });
        }
        text = [];
      };

      for (const child of node.children) {
        if (isImage(child)) {
          flush();
          paragraphs.push({ type: "paragraph", children: [child] });
        } else text.push(child);
      }
      flush();
      parent.children.splice(index, 1, ...paragraphs);
      return [SKIP, index + paragraphs.length];
    });

    // A run of back-to-back plates is laid out as rows of prints. Rows hold
    // three, or two where a three would strand a lone print at the end.
    const isPlate = (node: RootContent) =>
      node.type === "paragraph" &&
      node.children.length === 1 &&
      isImage(node.children[0]);
    const element = (
      className: string,
      children: RootContent[],
      extra: Record<string, string> = {}
    ) =>
      ({
        type: className,
        children,
        data: {
          hName: "div",
          hProperties: { className: [className], ...extra },
        },
      }) as unknown as RootContent;
    const grouped: RootContent[] = [];
    let run: RootContent[] = [];
    const flushRun = () => {
      if (run.length > 1) {
        const rows = rowSizes(run.length).map((size, i, sizes) => {
          const start = sizes.slice(0, i).reduce((a, b) => a + b, 0);
          return element("photo-row", run.slice(start, start + size), {
            "data-n": String(size),
          });
        });
        grouped.push(element("photo-group", rows));
      } else grouped.push(...run);
      run = [];
    };
    for (const node of tree.children) {
      if (isPlate(node)) run.push(node);
      else {
        flushRun();
        grouped.push(node);
      }
    }
    flushRun();
    tree.children = grouped;
  };
}

/** Splits `count` photos into rows of three, ending in pairs, never one. */
export function rowSizes(count: number): number[] {
  const remainder = count % 3;
  const threes = Math.floor(count / 3) - (remainder === 1 ? 1 : 0);
  const twos = remainder === 1 ? 2 : remainder === 2 ? 1 : 0;
  return [...Array(threes).fill(3), ...Array(twos).fill(2)];
}
