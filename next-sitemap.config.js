const siteUrl = process.env.NEXT_PUBLIC_ROOT_URL || "https://bneo.xyz";

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl,
  generateRobotsTxt: true,
  // Build time is not a modification time; claiming it on every URL teaches
  // Google to ignore lastmod. Posts carry real dates in /posts-sitemap.xml.
  autoLastmod: false,
  // Google ignores both; drop the "daily"/0.7 defaults.
  transform: async (config, loc) => ({
    loc,
    alternateRefs: config.alternateRefs ?? [],
    trailingSlash: config.trailingSlash,
  }),
  exclude: [
    "/admin",
    "/admin/*",
    // robots.txt disallows /api; listing it here is a contradiction crawlers report.
    "/api/*",
    // Files, not pages. Feeds are announced by <link rel="alternate"> instead.
    "/apple-icon.png",
    "/icon.ico",
    "/llms.txt",
    // Posts are in the hand-built /posts-sitemap.xml (real lastmod). The
    // /posts archive page itself stays here.
    "/posts/*",
    "/posts-sitemap.xml",
    "/rss.xml",
    "/essays/rss.xml",
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
