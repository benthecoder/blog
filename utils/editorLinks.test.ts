import { describe, expect, it } from "vitest";
import { EditorState } from "@codemirror/state";
import { markdown } from "@codemirror/lang-markdown";
import { editorLinkAt } from "@/components/admin/editorLinks";
const base = "http://localhost:3000/admin/edit/010326";
const resolve = (doc: string, text: string) =>
  editorLinkAt(
    EditorState.create({ doc, extensions: [markdown()] }),
    doc.indexOf(text) + 1,
    base
  );
describe("links while editing Markdown", () => {
  it("opens a Markdown link from either its title or URL", () => {
    const doc = "[a useful article](https://example.com/read)";
    expect(resolve(doc, "useful")).toBe("https://example.com/read");
    expect(resolve(doc, "example")).toBe("https://example.com/read");
  });
  it("supports plain URLs, autolinks, reference links and site-relative links", () => {
    expect(resolve("read https://example.com/plain today", "example")).toBe(
      "https://example.com/plain"
    );
    expect(resolve("<https://example.com/auto>", "example")).toBe(
      "https://example.com/auto"
    );
    expect(
      resolve(
        "[article][source]\n\n[source]: https://example.com/ref",
        "article"
      )
    ).toBe("https://example.com/ref");
    expect(resolve("[post](/posts/test)", "post")).toBe(
      "http://localhost:3000/posts/test"
    );
  });
  it("leaves ordinary text, images, code, and unsafe links alone", () => {
    for (const doc of [
      "plain example text",
      "![example](https://example.com/image)",
      "`https://example.com/code`",
      "```\nhttps://example.com/code\n```",
      "[example](javascript:alert)",
      "[example](mailto:a@example.com)",
      "[example](#heading)",
    ]) {
      expect(resolve(doc, "example")).toBeNull();
    }
  });
});
