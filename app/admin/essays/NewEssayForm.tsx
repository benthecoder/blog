"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function today() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function NewEssayForm({ existing }: { existing: string[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [slug, setSlug] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const create = async () => {
    const value = slug.trim();
    if (!SLUG.test(value) || value === "new") {
      setError("lowercase letters, numbers and hyphens only");
      return;
    }
    if (existing.includes(value)) {
      setError("that slug is taken");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/save-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "essay",
          slug: value,
          isNew: true,
          title: value.replace(/-/g, " "),
          subtitle: "",
          date: today(),
          content: "",
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "could not create");
        return;
      }
      router.push(`/admin/essays/edit/${encodeURIComponent(value)}`);
    } catch {
      setError("could not create");
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="shrink-0 whitespace-nowrap rounded-xs bg-ink dark:bg-chalk text-paper dark:text-night px-4 py-2 text-sm"
      >
        new essay
      </button>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void create();
      }}
      className="flex flex-col items-end gap-2"
    >
      <div className="flex items-center gap-2">
        <input
          autoFocus
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
          placeholder="slug-like-this"
          aria-label="essay slug"
          className="w-48 rounded-xs border border-rule dark:border-night-rule bg-transparent px-3 py-2 text-sm text-ink-strong dark:text-chalk-strong"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-xs bg-ink dark:bg-chalk text-paper dark:text-night px-4 py-2 text-sm disabled:opacity-30"
        >
          {busy ? "creating…" : "create"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError("");
          }}
          className="px-2 py-2 text-sm text-ink-soft dark:text-chalk-muted"
        >
          cancel
        </button>
      </div>
      {error && (
        <p role="alert" className="text-xs text-red-600 dark:text-red-500">
          {error}
        </p>
      )}
    </form>
  );
}
