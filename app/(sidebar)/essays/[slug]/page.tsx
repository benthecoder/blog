import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getEssayContent, getEssayMetadata } from "@/utils/content/essays";
import { formatEssayDate } from "@/utils/content/essayDate";
import { extractToc } from "@/utils/content/toc";
import { essayProseClasses } from "@/components/essays/essayProse";
import MarkdownContent from "@/components/posts/MarkdownContent";

export const dynamic = "force-static";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata | undefined> {
  const { slug } = await params;
  const essay = getEssayMetadata().find((e) => e.slug === slug);
  if (!essay) return;

  return {
    title: essay.title,
    description: essay.subtitle || undefined,
    alternates: {
      canonical: `/essays/${slug}`,
      types: { "application/rss+xml": "/essays/rss.xml" },
    },
  };
}

export const generateStaticParams = async () =>
  getEssayMetadata().map((essay) => ({ slug: essay.slug }));

const EssayPage = async ({ params }: { params: Params }) => {
  const { slug } = await params;
  const essay = getEssayMetadata().find((e) => e.slug === slug);
  if (!essay) return notFound();

  let content;
  try {
    content = getEssayContent(slug);
  } catch {
    return notFound();
  }

  // Only worth a contents list when the essay has real structure.
  const toc = extractToc(content.content).filter((e) => e.depth === 2);
  const meta = [
    formatEssayDate(essay.date),
    essay.updated && `revised ${formatEssayDate(essay.updated)}`,
    `${essay.readingTime} min read`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="mx-auto max-w-[65ch] py-12">
      <div className="mb-10">
        <Link
          href="/essays"
          className="text-xs lowercase tracking-wide text-ink-soft transition-colors hover:text-ink-strong dark:text-chalk-muted dark:hover:text-chalk-strong"
        >
          ← essays
        </Link>
      </div>

      <header className="mb-10">
        <h1 className="text-2xl font-bold lowercase leading-tight tracking-tight text-balance text-ink-strong dark:text-chalk-strong md:text-4xl">
          {essay.title}
        </h1>
        {essay.subtitle && (
          <p className="mt-3 text-base text-ink-soft dark:text-chalk-soft">
            {essay.subtitle}
          </p>
        )}
        <p className="mt-3 text-xs text-ink-soft/80 dark:text-chalk-muted">
          {meta}
        </p>
      </header>

      {toc.length >= 4 && (
        <nav aria-label="contents" className="mb-10 text-sm">
          <ol className="space-y-1.5 border-l border-rule pl-4 dark:border-night-rule">
            {toc.map((entry) => (
              <li key={entry.id}>
                <a
                  href={`#${entry.id}`}
                  className="text-ink-soft transition-colors hover:text-ink-strong dark:text-chalk-muted dark:hover:text-chalk-strong"
                >
                  {entry.text}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      )}

      <article className={essayProseClasses}>
        <MarkdownContent content={content.content} anchors />
      </article>
    </div>
  );
};

export default EssayPage;
