import type { Paragraph, PhrasingContent, Root } from "mdast";
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
  };
}
