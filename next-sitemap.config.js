const fs = require("fs");
const path = require("path");
const { isNoindexHtml } = require("./config/noindex");

const siteUrl = process.env.NEXT_PUBLIC_ROOT_URL || "https://bneo.xyz";

function isPrerenderedNoindex(loc) {
  const route = loc === "/" ? "/index" : loc.replace(/\/$/, "");
  const file = path.join(process.cwd(), ".next/server/app", `${route}.html`);
  try {
    return isNoindexHtml(fs.readFileSync(file, "utf8"));
  } catch {
    return false;
  }
}

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl,
  generateRobotsTxt: true,
  // Build time is not a modification time; claiming it on every URL teaches
  // Google to ignore lastmod. Posts carry real dates in /posts-sitemap.xml.
  autoLastmod: false,
  // Google ignores both; drop the "daily"/0.7 defaults.
  transform: async (config, loc) => {
    // Empty section pages ship <meta robots noindex>; keep them out of the
    // sitemap. A missing prerender (dynamic route, lookup miss) keeps the entry.
    if (isPrerenderedNoindex(loc)) return null;
    return {
      loc,
      alternateRefs: config.alternateRefs ?? [],
      trailingSlash: config.trailingSlash,
    };
  },
  exclude: [
    "/admin",
    "/admin/*",
    "/thoughts/new",
    "/tweet",
    // robots.txt disallows /api; listing it here is a contradiction crawlers report.
    "/api/*",
    // Files, not pages. Feeds are announced by <link rel="alternate"> instead.
    "/apple-icon.png",
    "/icon.ico",
    "/llms.txt",
    "/search-index.json",
    // Posts are in the hand-built /posts-sitemap.xml (real lastmod). The
    // /posts archive page itself stays here.
    "/posts/*",
    "/posts-sitemap.xml",
    "/rss.xml",
    "/essays",
    "/essays/*",
    "/wiki",
    "/wiki/*",
    // Canonical on maps.bneo.xyz / photos.bneo.xyz, not here.
    "/map",
    "/photos",
    "/photos/*",
    // Host-specific robots/sitemap for the subdomains, rewritten there.
    "/map/*",
  ],
  robotsTxtOptions: {
    additionalSitemaps: [`${siteUrl}/posts-sitemap.xml`],
    policies: require("./config/crawlerPolicies"),
  },
};
