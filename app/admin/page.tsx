import { getPostMetadata } from "@/utils/content/posts";
import CalendarView from "./CalendarView";
import { Suspense } from "react";
import AdminNavigation from "@/components/admin/AdminNavigation";

export default function AdminPage() {
  // PostMetadata links every post to its prev/next, so serializing it whole
  // ships the calendar a multi-megabyte payload. It only needs these four.
  const posts = getPostMetadata({ includeDrafts: true }).map(
    ({ slug, title, date, isDraft }) => ({ slug, title, date, isDraft })
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-surface">
      <div className="w-full max-w-6xl">
        <AdminNavigation section="posts" />
        <Suspense fallback={null}>
          <CalendarView posts={posts} />
        </Suspense>
      </div>
    </div>
  );
}
