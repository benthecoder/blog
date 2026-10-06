"use client";

import { useSyncExternalStore } from "react";
import { useSound } from "@/app/providers";

export default function SoundSwitch() {
  const { enabled, toggle } = useSound();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  if (!mounted) return <span aria-hidden="true">interface sounds</span>;
  return (
    <label className="inline-flex items-center gap-2 text-sm text-ink-soft dark:text-chalk-muted">
      <input
        type="checkbox"
        checked={enabled}
        onChange={toggle}
        className="accent-ink dark:accent-chalk"
      />
      interface sounds
    </label>
  );
}
