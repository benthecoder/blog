"use client";

import { useSyncExternalStore } from "react";

// An e-ink status bar redraws once a minute, so this ticks on the minute
// rather than every second. Ben's own clock, wherever the visitor is.
const formatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/New_York",
});

function subscribe(onTick: () => void) {
  let interval: ReturnType<typeof setInterval> | undefined;
  const timeout = setTimeout(
    () => {
      onTick();
      interval = setInterval(onTick, 60_000);
    },
    60_000 - (Date.now() % 60_000)
  );
  return () => {
    clearTimeout(timeout);
    if (interval) clearInterval(interval);
  };
}

const getTime = () => formatter.format(new Date());

export function StatusClock() {
  // Server renders a placeholder; the real time appears after hydration.
  const time = useSyncExternalStore(subscribe, getTime, () => null);
  return (
    <time title="my time, in new york" suppressHydrationWarning>
      {time ?? "--:--"}
    </time>
  );
}
