import Link from "next/link";
import getPostMetadata from "@/utils/getPostMetadata";
import { upstashRequest } from "@/utils/upstash";

export const revalidate = 60;

const fetchViewCounts = async () => {
  let cursor = "0";
  const keys: string[] = [];

  do {
    const result = (await upstashRequest([
      "SCAN",
      cursor,
      "MATCH",
      "views:*",
      "COUNT",
      200,
    ])) as [string, string[]];
    const [nextCursor, batch] = result;
    cursor = nextCursor;
    keys.push(...batch);
  } while (cursor !== "0");

  const viewKeys = keys.filter((key) => !key.startsWith("views:dedupe:"));
  if (viewKeys.length === 0) return [];

  const counts = (await upstashRequest(["MGET", ...viewKeys])) as Array<
    string | null
  >;

  return viewKeys.map((key, index) => ({
    slug: key.replace("views:", ""),
    count: Number(counts[index] ?? 0),
  }));
};

export default async function ViewsPage() {
  const posts = getPostMetadata({ includeDrafts: true });
  const postMap = new Map(posts.map((post) => [post.slug, post.title]));
  const rows = await fetchViewCounts();
  const sortedRows = rows.sort((a, b) => b.count - a.count);

  return (
    <div className="w-full flex flex-col items-center">
      <p className="text-[10px] tracking-[0.3em] uppercase opacity-30 mb-8">
        Views
      </p>

      <div className="w-full max-w-3xl px-4">
        <div className="border-t border-l border-japanese-shiraumenezu/40 dark:border-white/10">
          <div className="grid grid-cols-12 text-[10px] tracking-[0.2em] uppercase opacity-40">
            <div className="col-span-9 border-r border-b border-japanese-shiraumenezu/40 dark:border-white/10 p-3">
              Post
            </div>
            <div className="col-span-3 border-b border-japanese-shiraumenezu/40 dark:border-white/10 p-3 text-right">
              Views
            </div>
          </div>

          {sortedRows.length === 0 ? (
            <div className="border-b border-japanese-shiraumenezu/40 dark:border-white/10 p-4 text-xs opacity-60">
              No view data yet.
            </div>
          ) : (
            sortedRows.map((row) => {
              const title = postMap.get(row.slug) || row.slug;
              return (
                <div
                  key={row.slug}
                  className="grid grid-cols-12 text-xs border-b border-japanese-shiraumenezu/40 dark:border-white/10 text-japanese-sumiiro dark:text-japanese-shironezu"
                >
                  <div className="col-span-9 border-r border-japanese-shiraumenezu/40 dark:border-white/10 p-3 truncate">
                    <Link
                      href={`/posts/${row.slug}`}
                      className="hover:underline underline-offset-2"
                    >
                      {title}
                    </Link>
                  </div>
                  <div className="col-span-3 p-3 text-right font-mono">
                    {row.count.toLocaleString()}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
