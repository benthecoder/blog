"use client";

const DOTS = Array.from({ length: 180 }, (_, i) => ({
  x: ((i * 61 + 17) % 97) + 1.5,
  y: ((i * 37 + 29) % 95) + 2.5,
  opacity: 0.15 + ((i * 23) % 70) / 100,
  delay: `${(i % 7) * 0.2}s`,
}));

export default function UMAPLoader({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative ${className} bg-surface`}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
      }}
    >
      <svg className="w-full h-full absolute inset-0">
        {DOTS.map((dot, i) => (
          <circle
            key={i}
            cx={`${dot.x}%`}
            cy={`${dot.y}%`}
            r="3"
            className="fill-accent animate-pulse motion-reduce:animate-none"
            style={{
              opacity: dot.opacity,
              animationDelay: dot.delay,
            }}
          />
        ))}
      </svg>

      <div className="absolute bottom-4 left-4 z-10 bg-surface/90 px-3 py-1 rounded-sm border border-line text-xs text-ink-soft dark:text-chalk-muted">
        loading knowledge map...
      </div>
    </div>
  );
}
