import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { APP_ICONS } from "@/components/home/AppIcons";
import { DOCK_APPS, HOME_APPS, WIDGET_CELLS } from "./homeApps";

const ALL = [...HOME_APPS, ...DOCK_APPS];
const root = path.resolve(__dirname, "..");

// Where a site-relative href is served from in the app router.
function routeExists(href: string) {
  const seg = href.replace(/^\//, "");
  return [
    path.join(root, "app", "(sidebar)", seg, "page.tsx"),
    path.join(root, "app", seg, "page.tsx"),
    path.join(root, "app", seg, "route.ts"),
  ].some((p) => existsSync(p));
}

describe("home screen apps", () => {
  it("links every app to a route that exists", () => {
    for (const app of ALL) expect(routeExists(app.href), app.href).toBe(true);
  });

  it("has no duplicate destinations or labels", () => {
    expect(new Set(ALL.map((a) => a.href)).size).toBe(ALL.length);
    expect(new Set(ALL.map((a) => a.label)).size).toBe(ALL.length);
  });

  it("draws an icon for every app", () => {
    for (const app of ALL) expect(APP_ICONS[app.icon], app.icon).toBeDefined();
  });

  it("keeps labels short enough to sit under a 56px icon", () => {
    for (const app of ALL)
      expect(app.label.length, app.label).toBeLessThanOrEqual(10);
  });

  it("fills whole rows on the 4-column phone grid and the 6-column desktop grid", () => {
    const cells = HOME_APPS.length + WIDGET_CELLS;
    expect(cells % 4).toBe(0);
    expect(cells % 6).toBe(0);
  });

  it("fills the dock", () => {
    expect(DOCK_APPS).toHaveLength(4);
  });
});
