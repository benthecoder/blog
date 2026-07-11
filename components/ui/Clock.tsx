"use client";

import { useSyncExternalStore } from "react";

const TIMEZONE = "America/New_York";

function subscribe(onTick: () => void) {
  const id = setInterval(onTick, 1000);
  return () => clearInterval(id);
}

function getTime() {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: TIMEZONE,
    hour12: true,
  }).format(new Date());
}

export default function Clock() {
  // Server renders nothing; client picks up the ticking time after hydration.
  const time = useSyncExternalStore(subscribe, getTime, () => null);
  return <span>{time}</span>;
}
