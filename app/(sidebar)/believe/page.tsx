import type { Metadata } from "next";
import { readMarkdownFile } from "@/utils/content/markdown";
import { bodyOnlySchema } from "@/utils/content/schemas";
import MarkdownContent from "@/components/posts/MarkdownContent";
import { BELIEVE_MD } from "@/config/paths";
import { pageMetadata } from "@/utils/pageMetadata";

export const metadata: Metadata = pageMetadata({
  title: "things i believe",
  description: "some things i believe",
  path: "/believe",
});

export const dynamic = "force-static";

export default function BelievePage() {
  const { content } = readMarkdownFile(BELIEVE_MD, bodyOnlySchema);
  return (
    <div>
      <h1 className="text-2xl font-bold text-primary">things i believe</h1>
      <article className="prose mt-4">
        <MarkdownContent content={content} />
      </article>
    </div>
  );
}
