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

    // A run of back-to-back plates hangs as one print: wrap it so the
    // stylesheet can lay the plates side by side in a shared mat.
    const isPlate = (node: RootContent) =>
      node.type === "paragraph" &&
      node.children.length === 1 &&
      isImage(node.children[0]);
    const grouped: RootContent[] = [];
    let run: RootContent[] = [];
    const flushRun = () => {
      if (run.length > 1) {
        grouped.push({
          type: "photoGroup",
          children: run,
          data: {
            hName: "div",
            hProperties: {
              className: ["photo-group"],
              "data-count": String(run.length),
            },
          },
        } as unknown as RootContent);
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
