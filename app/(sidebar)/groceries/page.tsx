import type { Metadata } from "next";
import Link from "next/link";
import { readMarkdownFile } from "@/utils/content/markdown";
import MarkdownContent from "@/components/posts/MarkdownContent";
import { GROCERIES_MD } from "@/config/paths";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "groceries i like",
  description: "foods and ingredients i actually use, brands included",
  alternates: { canonical: "/groceries" },
};

const GroceriesPage = () => {
  const { content } = readMarkdownFile(GROCERIES_MD);

  return (
    <div className="mx-auto max-w-[65ch] pb-12 text-ink-strong dark:text-chalk-strong">
      <h1 className="mb-6 text-2xl font-bold lowercase">groceries i like</h1>

      <article className="prose prose-sm dark:prose-invert max-w-none prose-h2:mt-6 prose-h2:mb-2 prose-h2:text-sm prose-headings:font-bold prose-headings:lowercase prose-headings:text-ink-strong dark:prose-headings:text-chalk-strong prose-a:text-ink dark:prose-a:text-chalk-soft">
        <MarkdownContent content={content} />
      </article>

      <div className="mt-6">
        <Link
          href="/recipes"
          className="text-sm underline underline-offset-2 hover:text-ink dark:hover:text-chalk-soft"
        >
          go back
        </Link>
      </div>
    </div>
  );
};

export default GroceriesPage;
