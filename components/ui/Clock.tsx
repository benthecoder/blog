"use client";

import { useState, useEffect } from "react";

const TIMEZONE = "America/New_York";

export default function Clock() {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const fmt = () =>
      new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZone: TIMEZONE,
        hour12: true,
      }).format(new Date());

    setTime(fmt());
    const id = setInterval(() => setTime(fmt()), 1000);
    return () => clearInterval(id);
  }, []);

  return <span>{time}</span>;
}
