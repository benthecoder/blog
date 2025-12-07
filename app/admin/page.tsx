import getPostMetadata from "@/utils/getPostMetadata";
import { CalendarView } from "@/components/admin";
import { Suspense } from "react";

export default function AdminPage() {
  const posts = getPostMetadata({ includeDrafts: true });

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-japanese-kinairo dark:bg-gray-900">
      <div className="w-full max-w-6xl">
        <Suspense fallback={<div>Loading...</div>}>
          <CalendarView posts={posts} />
        </Suspense>
      </div>
    </div>
  );
}
