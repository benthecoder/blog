import Link from "next/link";

export default function AdminNavigation({
  section,
}: {
  section: "posts" | "wiki" | "essays";
}) {
  return (
    <nav
      aria-label="Admin sections"
      className="mb-6 flex gap-6 border-b border-line pb-3 text-sm"
    >
      {(
        [
          ["posts", "/admin", "Posts"],
          ["wiki", "/admin/wiki", "Wiki"],
          ["essays", "/admin/essays", "Essays"],
        ] as const
      ).map(([id, href, label]) => (
        <Link
          key={id}
          href={href}
          aria-current={section === id ? "page" : undefined}
          className={
            section === id
              ? "font-medium text-primary"
              : "text-ink-soft dark:text-chalk-muted hover:text-primary"
          }
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
