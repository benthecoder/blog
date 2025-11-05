import getPostMetadata from "@/utils/getPostMetadata";
import { CalendarView } from "@/components/admin";

export default function AdminPage() {
  const posts = getPostMetadata();

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-japanese-kinairo dark:bg-gray-900">
      <div className="w-full max-w-6xl">
        <CalendarView posts={posts} />
      </div>
    </div>
  );
}
