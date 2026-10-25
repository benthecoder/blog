import type { ReactNode } from "react";

// One-bit line art on a 24-unit grid: a single 1.5 stroke, round caps, no
// fills except dots. Drawn for this site so every app reads as one set; they
// inherit currentColor, so dark mode and the tap inversion come for free.
// To swap one for a hand-drawn reMarkable icon, replace its entry here.
export const APP_ICONS: Record<string, ReactNode> = {
  writing: (
    <>
      <path d="M12 21 7.5 12 9 6.5h6l1.5 5.5z" />
      <path d="M12 21v-7" />
      <circle cx="12" cy="12.5" r="1.2" />
      <path d="M9 6.5V3.5h6v3" />
    </>
  ),
  essays: (
    <>
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M14 3v4h4M9 11h6M9 14h6M9 17h4" />
    </>
  ),
  thoughts: (
    <>
      <path d="M8.2 16h8.8a3.5 3.5 0 0 0 .4-7A5 5 0 0 0 8 8.2 3.9 3.9 0 0 0 8.2 16z" />
      <circle cx="6.8" cy="19.2" r="1.2" />
      <circle cx="4.2" cy="21.5" r=".6" />
    </>
  ),
  wiki: (
    <>
      <circle cx="6" cy="7" r="2.2" />
      <circle cx="18" cy="6" r="2.2" />
      <circle cx="12" cy="17.5" r="2.2" />
      <circle cx="19.5" cy="17.5" r="1.4" />
      <path d="M8.2 6.8l7.6-.6M7.2 8.9l3.6 6.7M16.9 7.9l-3.8 7.6M14.2 17.5h3.9" />
    </>
  ),
  papers: (
    <>
      <path d="M9 6V3.5h10V18h-3" />
      <rect x="5" y="6" width="11" height="15" rx="1" />
      <path d="M8 10.5h5M8 13.5h5M8 16.5h3" />
    </>
  ),
  library: (
    <>
      <rect x="3.5" y="4" width="4" height="16" rx=".5" />
      <rect x="8.5" y="4" width="4" height="16" rx=".5" />
      <path d="M14.6 5.3l3.9-1 3.8 15.4-3.9 1z" />
      <path d="M3.5 8h4M8.5 16h4" />
    </>
  ),
  flashcards: (
    <>
      <path d="M8 5.5V4a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-2" />
      <rect x="3" y="7.5" width="15" height="12" rx="1.5" />
      <path d="M8.9 12a1.7 1.7 0 1 1 2.3 1.6c-.5.2-.7.6-.7 1.1" />
      <circle cx="10.5" cy="16.8" r=".5" fill="currentColor" stroke="none" />
    </>
  ),
  curius: (
    <>
      <path d="M7 3h10v18l-5-4.2L7 21z" />
      <path d="M10 8h4" />
    </>
  ),
  photos: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8.5 7 10 4h4l1.5 3" />
      <circle cx="12" cy="13.5" r="3.5" />
      <circle cx="17.6" cy="10" r=".6" fill="currentColor" stroke="none" />
    </>
  ),
  places: (
    <>
      <path d="M3 6.5 8.5 4.5l7 2 5.5-2v13l-5.5 2-7-2-5.5 2z" />
      <path d="M8.5 4.5v13M15.5 6.5v13" />
    </>
  ),
  recipes: (
    <>
      <path d="M3.5 12.5h17c0 4.4-3.8 7.5-8.5 7.5s-8.5-3.1-8.5-7.5z" />
      <path d="M13.5 10.5 20 4M16 11l5.5-4.5" />
      <path d="M7 9.5c-1-1.2 1-2.3 0-3.5M10 9.5c-1-1.2 1-2.3 0-3.5" />
    </>
  ),
  wave: (
    <>
      <path d="M2 9.5c2.5 0 2.5-3 5-3s2.5 3 5 3 2.5-3 5-3 2.5 3 5 3" />
      <path d="M2 14c2.5 0 2.5-3 5-3s2.5 3 5 3 2.5-3 5-3 2.5 3 5 3" />
      <path d="M2 18.5c2.5 0 2.5-3 5-3s2.5 3 5 3 2.5-3 5-3 2.5 3 5 3" />
    </>
  ),
  projects: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 8h18M10 11.5 7.5 14l2.5 2.5M14 11.5l2.5 2.5-2.5 2.5" />
    </>
  ),
  now: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  hn: (
    <>
      <path d="M4 4h13v15a2 2 0 0 0 2 2H6a2 2 0 0 1-2-2z" />
      <path d="M17 8.5h3V19a2 2 0 0 1-2 2" />
      <path d="M7 8h7M7 11.5h7M7 15h7M7 18h4" />
    </>
  ),
  uses: (
    <>
      <rect x="3" y="8.5" width="18" height="11.5" rx="1.5" />
      <path d="M9 8.5V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2.5M3 13.5h18" />
      <path d="M10.5 12.5v2h3v-2" />
    </>
  ),
  start: (
    <>
      <path d="M12 3v3M12 11v10M8 21h8" />
      <path d="M5.5 6H17l2.5 2.5L17 11H5.5z" />
    </>
  ),
  tags: (
    <>
      <path d="M3.5 3.5h7.5l9.5 9.5-7.5 7.5-9.5-9.5z" />
      <circle cx="8" cy="8" r="1.5" />
    </>
  ),
  colophon: (
    <>
      <path d="M3 19 7.5 6 12 19M4.8 14.5h5.4" />
      <circle cx="17.3" cy="16" r="3" />
      <path d="M20.3 12.5V19" />
    </>
  ),
  rss: (
    <>
      <circle cx="5.5" cy="18.5" r="1.5" />
      <path d="M4 11a9 9 0 0 1 9 9M4 4a16 16 0 0 1 16 16" />
    </>
  ),
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.5 15.5 5 5" />
    </>
  ),
  random: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="3" />
      {[
        [8.5, 8.5],
        [15.5, 8.5],
        [12, 12],
        [8.5, 15.5],
        [15.5, 15.5],
      ].map(([cx, cy]) => (
        <circle
          key={`${cx}-${cy}`}
          cx={cx}
          cy={cy}
          r="1.2"
          fill="currentColor"
          stroke="none"
        />
      ))}
    </>
  ),
  about: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20.5c.8-3.8 3.6-6 7-6s6.2 2.2 7 6" />
    </>
  ),
  contact: (
    <>
      <rect x="3" y="5.5" width="18" height="13" rx="1.5" />
      <path d="m3.5 6.5 8.5 6.5 8.5-6.5" />
    </>
  ),
};

export function AppIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {APP_ICONS[name]}
    </svg>
  );
}
