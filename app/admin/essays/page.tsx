import Link from "next/link";
import AdminNavigation from "@/components/admin/AdminNavigation";
import { getEssayAdminList } from "@/utils/content/essays";
import { formatEssayDate } from "@/utils/content/essayDate";
import NewEssayForm from "./NewEssayForm";

export const dynamic = "force-dynamic";

export default function AdminEssaysPage() {
  const essays = getEssayAdminList();
  return (
    <div className="min-h-screen px-6 py-10 bg-paper dark:bg-night">
      <div className="mx-auto max-w-3xl">
        <AdminNavigation section="essays" />
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl text-ink-strong dark:text-chalk-strong">
              Essays
            </h1>
            <p className="mt-2 text-sm text-ink-soft dark:text-chalk-muted">
              Long-form writing. Drafts stay local until published.
            </p>
          </div>
          <NewEssayForm existing={essays.map((essay) => essay.slug)} />
        </div>
        {essays.length === 0 ? (
          <div className="border border-rule dark:border-night-rule rounded-xs p-8 text-center text-ink-soft dark:text-chalk-muted">
            <p>No essays yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-rule dark:divide-night-rule">
            {essays.map((essay) => (
              <li key={`${essay.isDraft ? "draft" : "live"}-${essay.slug}`}>
                <Link
                  href={`/admin/essays/edit/${encodeURIComponent(essay.slug)}`}
                  className="block py-5 hover:bg-paper-tint dark:hover:bg-night-raised px-3 rounded-xs"
                >
                  <span className="text-xs text-ink-soft dark:text-chalk-muted">
                    {essay.isDraft ? "draft" : "live"}
                    {essay.date && ` · ${formatEssayDate(essay.date)}`}
                  </span>
                  <h2 className="mt-1 text-lg lowercase text-ink-strong dark:text-chalk-strong">
                    {essay.title}
                  </h2>
                  {essay.subtitle && (
                    <p className="mt-1 text-sm text-ink-soft dark:text-chalk-muted">
                      {essay.subtitle}
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
