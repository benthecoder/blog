import { createElement } from "react";
import { renderToReadableStream } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import PostPage from "@/app/(sidebar)/posts/[slug]/page";
import MarkdownContent from "@/components/posts/MarkdownContent";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), prefetch: vi.fn() }),
  notFound: () => {
    throw new Error("Not found");
  },
}));

async function render(node: Parameters<typeof renderToReadableStream>[0]) {
  const stream = await renderToReadableStream(node);
  await stream.allReady;
  const html = await new Response(stream).text();
  return { html, images: html.match(/<img\b[^>]*>/g) ?? [] };
}

describe("post image priority", () => {
  it("gives only the hero eager loading on the published year-in-review post", async () => {
    const { html, images } = await render(
      await PostPage({ params: Promise.resolve({ slug: "311225" }) })
    );
    expect(images).toHaveLength(10);
    expect(
      html.match(/<link\b(?=[^>]*rel="preload")(?=[^>]*as="image")[^>]*>/g)
    ).toHaveLength(1);
    expect(images[0]).toContain('loading="eager"');
    expect(
      images.slice(1).every((image) => image.includes('loading="lazy"'))
    ).toBe(true);
  });
  it("still prioritizes the first image when no separate hero is rendered", async () => {
    const { images } = await render(
      createElement(MarkdownContent, {
        content:
          "Intro.\n\n![First](/images/first.jpg)\n\n![Second](/images/second.jpg)",
      })
    );
    expect(images[0]).toContain('loading="eager"');
    expect(images[1]).toContain('loading="lazy"');
  });
});
