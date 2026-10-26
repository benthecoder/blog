import Link from "next/link";
import { getPostMetadata } from "@/utils/content/posts";

const RECENT = 5;

const SECTIONS: { label: string; links: [string, string][] }[] = [
  {
    label: "writing",
    links: [
      ["/posts", "posts"],
      ["/thoughts", "thoughts"],
    ],
  },
  {
    label: "making",
    links: [
      ["/projects", "projects"],
      ["/sketch", "sketch"],
      ["/recipes", "recipes"],
    ],
  },
  {
    label: "collecting",
    links: [
      ["/photos", "photos"],
      ["/map", "places"],
      ["/library", "library"],
      ["/papers", "papers"],
      ["/curius", "curius"],
      ["/now", "now"],
      ["/uses", "uses"],
    ],
  },
];

const label = "text-xs text-primary/60";
const quiet =
  "text-ink-soft dark:text-chalk-muted hover:text-ink dark:hover:text-chalk hover:underline transition-colors";

export default function HomeIndex() {
  const posts = getPostMetadata();
  const recent = posts.slice(0, RECENT);

  return (
    <section
      aria-label="index"
      className="mx-auto w-full max-w-[36rem] px-4 pt-16 pb-[max(4rem,env(safe-area-inset-bottom))] text-sm space-y-10"
    >
      <div>
        <p className={`${label} mb-2`}>recent writing</p>
        <ul className="space-y-1">
          {recent.map((post) => (
            <li key={post.slug}>
              <Link
                href={`/posts/${post.slug}`}
                className="group flex justify-between items-baseline gap-4"
              >
                <span className="text-accent group-hover:underline">
                  {post.title}
                </span>
                <span className="text-muted shrink-0 text-xs">{post.date}</span>
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/posts" className={`${quiet} inline-block mt-3 text-xs`}>
          all {posts.length} posts →
        </Link>
      </div>

      <div>
        <p className={`${label} mb-2`}>elsewhere on the site</p>
        <ul className="space-y-1">
          {SECTIONS.map((section) => (
            <li key={section.label} className="flex gap-3">
              <span className="w-20 shrink-0 text-xs text-muted leading-5">
                {section.label}
              </span>
              <span className="flex flex-wrap gap-x-3">
                {section.links.map(([href, name]) => (
                  <Link key={href} href={href} className={quiet}>
                    {name}
                  </Link>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
