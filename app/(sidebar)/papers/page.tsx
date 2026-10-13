import Link from "next/link";
import type { Metadata } from "next";
import { PAPERS_ROUTE } from "@/config/paths";
import { getPaperList, type PaperListItem } from "@/utils/content/papers";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "papers",
  description: "papers i've read and am tracking",
  alternates: { canonical: PAPERS_ROUTE },
};

function monthLabel(month: string): string {
  if (!month) return "earlier";
  const date = new Date(`${month}-01T12:00:00Z`);
  return date
    .toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    })
    .toLowerCase();
}

function Paper({ paper }: { paper: PaperListItem }) {
  const byline = [paper.authors, paper.year].filter(Boolean).join(", ");
  return (
    <li>
      {paper.note ? (
        <>
          <Link href={paper.note}>{paper.title}</Link>{" "}
          <a
            href={paper.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${paper.title} (paper)`}
          >
            ↗
          </a>
        </>
      ) : (
        <a href={paper.url} target="_blank" rel="noopener noreferrer">
          {paper.title}
        </a>
      )}
      {byline && <> ({byline})</>}
    </li>
  );
}

const PapersPage = () => {
  const { upNext, read } = getPaperList();

  return (
    <div>
      <article className="prose">
        <h2>up next</h2>
        {upNext.length ? (
          <ul>
            {upNext.map((paper) => (
              <Paper key={paper.url} paper={paper} />
            ))}
          </ul>
        ) : (
          <p>nothing queued.</p>
        )}

        <h2>read</h2>
        {read.length === 0 && <p>nothing yet.</p>}
        {read.map((group) => (
          <section key={group.month || "undated"}>
            <h3>{monthLabel(group.month)}</h3>
            <ul>
              {group.papers.map((paper) => (
                <Paper key={paper.url} paper={paper} />
              ))}
            </ul>
          </section>
        ))}
      </article>
    </div>
  );
};

export default PapersPage;
