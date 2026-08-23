import Link from "next/link";
import { getWikiByCategory } from "@/utils/content/wiki";
import type { Metadata } from "next";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "wiki",
  description: "A directory of things I've written up",
};

const WikiPage = () => {
  const categories = getWikiByCategory();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-ink-strong dark:text-chalk-strong mb-14 lowercase">
        wiki
      </h1>

      {categories.length === 0 ? (
        <p className="text-sm text-ink-strong/40 dark:text-chalk-strong/40">
          Nothing here yet.
        </p>
      ) : (
        <div className="space-y-12">
          {categories.map((category) => (
            <section key={category.name}>
              <h2 className="text-sm text-ink-strong/40 dark:text-chalk-strong/40 mb-4 lowercase">
                {category.name}
              </h2>
              <ul className="space-y-2.5">
                {category.pages.map((page) => (
                  <li key={page.slug}>
                    <Link
                      href={`/wiki/${page.slug}`}
                      className="text-sm text-ink dark:text-chalk-soft hover:underline underline-offset-2 lowercase"
                    >
                      {page.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

export default WikiPage;
