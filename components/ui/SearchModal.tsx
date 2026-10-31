"use client";

import { useEffect, useRef, useState } from "react";
import SearchExplorer from "@/components/search/SearchExplorer";
import { loadLocalSearch } from "@/utils/loadLocalSearch";

export default function SearchModal() {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openRef = useRef(false);

  // Warm the shared index after the page settles, before the first query.
  useEffect(() => {
    const timer = setTimeout(() => {
      void loadLocalSearch().catch(() => {});
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Open on cmd+K / ctrl+K, or custom "openSearch" event (from sidebar button).
  // State resets happen when opening, so a fresh modal is shown each time.
  useEffect(() => {
    const openFresh = () => {
      setOpen(true);
    };
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (openRef.current) {
          setOpen(false);
        } else {
          openFresh();
        }
      }
    };
    const onOpen = () => openFresh();
    document.addEventListener("keydown", onKey);
    document.addEventListener("openSearch", onOpen);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("openSearch", onOpen);
    };
  }, []);

  useEffect(() => {
    openRef.current = open;
    if (!open) return;

    const dialog = dialogRef.current;
    dialog?.showModal();

    const { overflow, paddingRight } = document.body.style;
    const gutter = window.innerWidth - document.documentElement.clientWidth;
    const padding = parseFloat(getComputedStyle(document.body).paddingRight);
    document.body.style.overflow = "hidden";
    if (gutter > 0) document.body.style.paddingRight = `${padding + gutter}px`;
    if (dialog) dialog.style.paddingRight = `${gutter}px`;

    return () => {
      dialog?.close();
      if (dialog) dialog.style.paddingRight = "";
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
    };
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-label="Search posts"
      className="fixed inset-0 z-100 m-0 h-full max-h-none w-full max-w-none hidden open:flex items-start justify-center border-0 bg-transparent p-0 pt-[8vh] text-inherit backdrop:bg-transparent"
      onCancel={(event) => {
        event.preventDefault();
        setOpen(false);
      }}
      onClick={() => setOpen(false)}
    >
      <div className="absolute inset-0 bg-surface/80 backdrop-blur-xs" />
      <div
        className="relative mx-3 w-full min-w-0 max-w-5xl text-primary"
        onClick={(event) => event.stopPropagation()}
      >
        {open && <SearchExplorer onNavigate={() => setOpen(false)} />}
      </div>
    </dialog>
  );
}
