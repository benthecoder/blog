import Link from "next/link";
import type { Metadata } from "next";
import { PAPERS_ROUTE } from "@/config/paths";
import { getPapers, groupPapersByTopic } from "@/utils/content/papers";
import { pageMetadata } from "@/utils/pageMetadata";

export const dynamic = "force-static";

export const metadata: Metadata = pageMetadata({
  title: "papers",
  description: "Papers I've read, with my notes",
  path: PAPERS_ROUTE,
});

function formatRead(date: string): string {
  const parsed = new Date(`${date}T12:00:00Z`);
  if (!date || Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

const PapersPage = () => {
  const papers = getPapers();
  const groups = groupPapersByTopic(papers);

  return (
    <div className="mx-auto max-w-[65ch] py-12">
      <h1 className="mb-2 text-2xl font-bold lowercase text-primary">papers</h1>
      <p className="mb-10 text-sm text-secondary">
        papers i&apos;ve read, with my notes. each links into the{" "}
        <Link href="/wiki" className="underline underline-offset-2">
          wiki
        </Link>
        .
      </p>
      {groups.length === 0 ? (
        <p className="text-sm text-primary/60">Nothing here yet.</p>
      ) : (
        <div className="space-y-12">
          {groups.map((group) => (
            <section key={group.slug} aria-labelledby={`topic-${group.slug}`}>
              <h2 id={`topic-${group.slug}`} className="eyebrow mb-4 font-mono">
                {group.label} · {group.papers.length}
              </h2>
              <ul className="space-y-6">
                {group.papers.map((paper) => {
                  const byline = [paper.authors, paper.year]
                    .filter(Boolean)
                    .join(" · ");
                  const read = formatRead(paper.read);
                  return (
                    <li key={paper.slug}>
                      <Link
                        href={`/wiki/${paper.slug}`}
                        className="group block"
                      >
                        <h3 className="text-base font-bold lowercase text-ink-strong transition-colors group-hover:text-ink dark:text-chalk-strong dark:group-hover:text-chalk-soft">
                          {paper.title}
                        </h3>
                        {byline && (
                          <p className="mt-0.5 text-sm text-secondary">
                            {byline}
                          </p>
                        )}
                        {read && (
                          <p className="mt-1 text-xs text-ink-soft/80 dark:text-chalk-muted">
                            read {read}
                          </p>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

export default PapersPage;
