"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

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
      <Button
        variant="solid"
        onClick={() => setOpen(true)}
        className="shrink-0 whitespace-nowrap"
      >
        new essay
      </Button>
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
          className="w-48 rounded-xs border border-line bg-transparent px-3 py-2 text-sm text-primary"
        />
        <Button type="submit" variant="solid" disabled={busy}>
          {busy ? "creating…" : "create"}
        </Button>
        <Button
          onClick={() => {
            setOpen(false);
            setError("");
          }}
        >
          cancel
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </form>
  );
}
