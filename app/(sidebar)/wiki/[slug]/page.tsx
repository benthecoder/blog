import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getWikiMetadata, getWikiContent } from "@/utils/content/wiki";
import MarkdownContent from "@/components/posts/MarkdownContent";
import Backlinks from "@/components/content/Backlinks";

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
    <div className="mx-auto max-w-xl px-4 py-12">
      <div className="mb-10">
        <Link
          href="/wiki"
          className="text-xs lowercase tracking-wide text-ink-soft dark:text-chalk-muted transition-colors hover:text-ink-strong dark:hover:text-chalk-strong"
        >
          ← wiki
        </Link>
      </div>

      <div className="mb-10">
        {meta.tags.length > 0 && (
          <p className="mb-2 text-xs lowercase tracking-wide text-ink-soft dark:text-chalk-muted">
            {meta.tags.join(" · ")}
          </p>
        )}
        <h1 className="text-2xl font-bold lowercase text-ink-strong dark:text-chalk-strong">
          {meta.title}
        </h1>
        {meta.description && (
          <p className="mt-2 text-sm text-ink-soft dark:text-chalk-muted">
            {meta.description}
          </p>
        )}
      </div>

      <article className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-bold prose-headings:text-ink-strong dark:prose-headings:text-chalk-strong prose-a:text-ink dark:prose-a:text-chalk-soft prose-a:no-underline prose-a:hover:underline">
        <MarkdownContent content={content.content} />
      </article>

      <Backlinks contentRef={{ kind: "wiki", slug }} />
    </div>
  );
};

export default WikiSlugPage;
