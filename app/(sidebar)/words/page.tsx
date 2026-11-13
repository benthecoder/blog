import { Metadata } from "next";
import { readMarkdownFile } from "@/utils/content/markdown";
import { bodyOnlySchema } from "@/utils/content/schemas";
import MarkdownContent from "@/components/posts/MarkdownContent";
import { WORDS_MD } from "@/config/paths";
import { pageMetadata } from "@/utils/pageMetadata";

export const metadata: Metadata = pageMetadata({
  title: "words",
  description: "things i believe, verses i hold onto, and reminders to myself",
  path: "/words",
});

export const dynamic = "force-static";

export default function WordsPage() {
  const { content } = readMarkdownFile(WORDS_MD, bodyOnlySchema);
  return (
    <div>
      <h1 className="sr-only">words</h1>
      <article className="prose">
        <MarkdownContent content={content} />
      </article>
    </div>
  );
}
