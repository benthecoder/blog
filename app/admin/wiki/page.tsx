import Link from "next/link";
import AdminNavigation from "@/components/admin/AdminNavigation";
import { getWikiMetadata } from "@/utils/content/wiki";

export const dynamic = "force-dynamic";

export default function AdminWikiPage() {
  const pages = getWikiMetadata();
  return (
    <div className="min-h-screen px-6 py-10 bg-surface">
      <div className="mx-auto max-w-3xl">
        <AdminNavigation section="wiki" />
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl text-primary">Wiki pages</h1>
            <p className="mt-2 text-sm text-ink-soft dark:text-chalk-muted">
              Living notes, connected with [[links]].
            </p>
          </div>
          <Link
            href="/admin/wiki/edit/new"
            className="rounded-xs bg-accent text-surface px-4 py-2 text-sm"
          >
            New page
          </Link>
        </div>
        {pages.length === 0 ? (
          <div className="border border-line rounded-xs p-8 text-center text-ink-soft dark:text-chalk-muted">
            <p>No wiki pages yet.</p>
            <p className="mt-2 text-sm">
              Start with a topic you want to keep coming back to.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {pages.map((page) => (
              <li key={page.slug}>
                <Link
                  href={`/admin/wiki/edit/${encodeURIComponent(page.slug)}`}
                  className="block py-5 hover:bg-paper-tint dark:hover:bg-night-raised px-3 rounded-xs"
                >
                  <span className="text-xs text-ink-soft dark:text-chalk-muted">
                    {page.category}
                  </span>
                  <h2 className="mt-1 text-lg text-primary">{page.title}</h2>
                  {page.description && (
                    <p className="mt-1 text-sm text-ink-soft dark:text-chalk-muted">
                      {page.description}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
