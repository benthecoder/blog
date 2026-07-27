import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getWikiMetadata, getWikiContent } from "@/utils/content/wiki";
import MarkdownContent from "@/components/posts/MarkdownContent";

export const dynamic = "force-static";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata | undefined> {
  const { slug } = await params;
  const pages = getWikiMetadata();
  const page = pages.find((p) => p.slug === slug);
  if (!page) return;

  return {
    title: page.title,
    description: page.description,
    alternates: {
      canonical: `/wiki/${slug}`,
    },
  };
}

export const generateStaticParams = async () => {
  const pages = getWikiMetadata();
  return pages.map((page) => ({ slug: page.slug }));
};

const WikiSlugPage = async ({ params }: { params: Params }) => {
  const { slug } = await params;
  const pages = getWikiMetadata();
  const meta = pages.find((p) => p.slug === slug);

  if (!meta) return notFound();

  let content;
  try {
    content = getWikiContent(slug);
  } catch {
    return notFound();
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-2">
        <Link
          href="/wiki"
          className="text-[10px] font-mono tracking-widest text-ink-strong/40 dark:text-chalk-strong/40 hover:text-ink dark:hover:text-chalk-soft transition-colors uppercase"
        >
          ← Wiki
        </Link>
      </div>

      <div className="mb-8">
        {meta.tags.length > 0 && (
          <p className="text-[10px] text-ink-strong/40 dark:text-chalk-strong/40 tracking-widest font-mono uppercase mb-1">
            {meta.tags.join(" · ")}
          </p>
        )}
        <h1 className="text-2xl font-bold text-ink-strong dark:text-chalk-strong">
          {meta.title}
        </h1>
        {meta.description && (
          <p className="text-sm text-ink-strong/60 dark:text-chalk-strong/60 mt-1">
            {meta.description}
          </p>
        )}
        {meta.lastUpdated && (
          <p className="text-[10px] font-mono text-ink-strong/30 dark:text-chalk-strong/30 mt-2">
            last updated {meta.lastUpdated}
          </p>
        )}
      </div>

      <article className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-bold prose-headings:text-ink-strong dark:prose-headings:text-chalk-strong prose-a:text-ink dark:prose-a:text-chalk-soft prose-a:no-underline prose-a:hover:underline">
        <MarkdownContent content={content.content} />
      </article>
    </div>
  );
};

export default WikiSlugPage;
