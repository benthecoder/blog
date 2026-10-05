"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

interface Item {
  id: number;
  content: string;
  link: string | null;
  title: string | null;
}

export default function RecentList({ items }: { items: Item[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [deleting, setDeleting] = useState<number | null>(null);

  async function remove(id: number) {
    setDeleting(id);
    try {
      await fetch("/api/tweet", {
        body: JSON.stringify({ id }),
        headers: { "Content-Type": "application/json" },
        method: "DELETE",
      });
      startTransition(() => router.refresh());
    } finally {
      setDeleting(null);
    }
  }

  return (
    <ul className="max-w-[500px] space-y-2">
      {items.map((t) => (
        <li
          key={t.id}
          className={`group flex items-start gap-3 text-sm text-ink dark:text-chalk transition-opacity ${deleting === t.id ? "opacity-40" : ""}`}
        >
          <span className="flex-1 break-words">
            {t.content}
            {t.link && /^https?:\/\//.test(t.link) && (
              <a
                href={t.link}
                target="_blank"
                rel="noreferrer"
                className="block text-xs text-ink-muted dark:text-chalk-muted underline truncate"
              >
                {t.title ?? t.link}
              </a>
            )}
          </span>
          <button
            type="button"
            aria-label="delete"
            disabled={deleting !== null}
            onClick={() => remove(t.id)}
            className="shrink-0 text-xs text-ink-muted dark:text-chalk-muted hover:text-red-500 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
          >
            delete
          </button>
        </li>
      ))}
    </ul>
  );
}
