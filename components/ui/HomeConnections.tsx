"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

const KnowledgeMap = dynamic(
  () => import("@/components/visualizations/KnowledgeMap"),
  {
    ssr: false,
    loading: () => (
      <p className="p-4 text-sm text-muted">loading connections…</p>
    ),
  }
);

export default function HomeConnections() {
  const section = useRef<HTMLElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const element = section.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setReady(true);
          observer.disconnect();
        }
      },
      { rootMargin: "400px" }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={section}
      aria-labelledby="connections-heading"
      className="mt-10"
    >
      <h2 id="connections-heading" className="text-base font-bold text-primary">
        connections
      </h2>
      <p className="mt-2 mb-4 text-sm text-muted">
        explore how the entries in this notebook connect.
      </p>
      <div className="mt-4 min-h-[27rem] sm:min-h-[33rem]">
        {ready ? (
          <KnowledgeMap className="w-full" />
        ) : (
          <p className="p-4 text-sm text-muted">loading connections…</p>
        )}
      </div>
    </section>
  );
}
