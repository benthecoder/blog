import Link from "next/link";

export default function AdminNavigation({
  section,
}: {
  section: "posts" | "wiki";
}) {
  return (
    <nav
      aria-label="Admin sections"
      className="mb-6 flex gap-6 border-b border-rule dark:border-night-rule pb-3 text-sm"
    >
      {(
        [
          ["posts", "/admin", "Posts"],
          ["wiki", "/admin/wiki", "Wiki"],
        ] as const
      ).map(([id, href, label]) => (
        <Link
          key={id}
          href={href}
          aria-current={section === id ? "page" : undefined}
          className={
            section === id
              ? "font-medium text-ink-strong dark:text-chalk-strong"
              : "text-ink-soft dark:text-chalk-muted hover:text-ink-strong dark:hover:text-chalk-strong"
          }
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
