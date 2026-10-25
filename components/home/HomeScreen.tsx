import Link from "next/link";
import { DOCK_APPS, HOME_APPS, type HomeApp } from "@/config/homeApps";
import {
  SketchIcon,
  ENAME_RATIO,
  CNAME_RATIO,
} from "@/components/ui/SketchIcon";
import { AppIcon } from "./AppIcons";
import { SketchWidget } from "./SketchWidget";
import { StatusClock } from "./StatusClock";
import { TapFlash } from "./TapFlash";

function AppTile({ app }: { app: HomeApp }) {
  const inner = (
    <>
      <span className="eink-icon">
        <AppIcon name={app.icon} />
      </span>
      <span className="eink-label">{app.label}</span>
    </>
  );
  // Route handlers (the RSS feed) aren't pages, so they get a plain anchor.
  if (app.href.startsWith("/api/")) {
    return (
      <a href={app.href} data-app="" className="eink-tile" title={app.hint}>
        {inner}
      </a>
    );
  }
  return (
    <Link
      href={app.href}
      data-app=""
      className="eink-tile"
      title={app.hint}
      // 24 links on one screen: don't prefetch them all on load (and never
      // prefetch /random, which would roll the dice in the background).
      prefetch={false}
    >
      {inner}
    </Link>
  );
}

function Battery() {
  return (
    <svg
      viewBox="0 0 26 12"
      className="h-[10px] w-auto"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      aria-hidden="true"
    >
      <rect x=".6" y=".6" width="22" height="10.8" rx="2" />
      <rect
        x="2.6"
        y="2.6"
        width="18"
        height="6.8"
        rx=".8"
        fill="currentColor"
        stroke="none"
      />
      <path d="M24.4 4v4" strokeLinecap="round" strokeWidth="1.6" />
    </svg>
  );
}

export function HomeScreen({ postCount }: { postCount: number }) {
  return (
    <div className="eink-home">
      <header className="eink-status">
        <span>benneo</span>
        <StatusClock />
        <span
          className="flex items-center gap-1.5"
          title="fully charged, writing daily"
        >
          {postCount.toLocaleString("en-US")} posts
          <Battery />
        </span>
      </header>

      <div className="flex flex-col items-center gap-2 pt-5 pb-6 md:pt-8 md:pb-10">
        <h1 className="sr-only">Benedict Neo</h1>
        <Link
          href="/about"
          aria-label="about Benedict Neo"
          className="eink-wordmark"
        >
          <SketchIcon
            src="/icons/ename.svg"
            className="w-28 md:w-36"
            style={{
              aspectRatio: ENAME_RATIO,
              backgroundColor: "currentColor",
            }}
          />
          <SketchIcon
            src="/icons/cname.svg"
            className="w-16 md:w-20"
            style={{
              aspectRatio: CNAME_RATIO,
              backgroundColor: "currentColor",
            }}
          />
        </Link>
      </div>

      <nav aria-label="sections" className="eink-screen">
        <ul className="eink-grid">
          <li className="eink-widget-cell">
            <SketchWidget />
          </li>
          {HOME_APPS.map((app) => (
            <li key={app.href}>
              <AppTile app={app} />
            </li>
          ))}
        </ul>
      </nav>

      <nav aria-label="dock" className="eink-dock">
        <ul>
          {DOCK_APPS.map((app) => (
            <li key={app.href}>
              <AppTile app={app} />
            </li>
          ))}
        </ul>
      </nav>

      <TapFlash />
    </div>
  );
}
