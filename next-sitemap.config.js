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
  ],
  robotsTxtOptions: {
    additionalSitemaps: [`${siteUrl}/posts-sitemap.xml`],
    policies: [
      // AI crawlers: no scraping, no training data. One policy per agent —
      // next-sitemap prints a policy's userAgent verbatim on a single
      // User-agent line, and a comma-joined line matches no crawler.
      { userAgent: "GPTBot", disallow: ["/"] },
      { userAgent: "OAI-SearchBot", disallow: ["/"] },
      { userAgent: "ChatGPT-User", disallow: ["/"] },
      { userAgent: "ClaudeBot", disallow: ["/"] },
      { userAgent: "Claude-SearchBot", disallow: ["/"] },
      { userAgent: "Claude-User", disallow: ["/"] },
      { userAgent: "anthropic-ai", disallow: ["/"] },
      { userAgent: "CCBot", disallow: ["/"] },
      { userAgent: "Google-Extended", disallow: ["/"] },
      { userAgent: "Applebot-Extended", disallow: ["/"] },
      { userAgent: "Meta-ExternalAgent", disallow: ["/"] },
      { userAgent: "Meta-ExternalFetcher", disallow: ["/"] },
      { userAgent: "Bytespider", disallow: ["/"] },
      { userAgent: "PerplexityBot", disallow: ["/"] },
      { userAgent: "Perplexity-User", disallow: ["/"] },
      { userAgent: "cohere-ai", disallow: ["/"] },
      { userAgent: "Diffbot", disallow: ["/"] },
      { userAgent: "Omgilibot", disallow: ["/"] },
      { userAgent: "ImagesiftBot", disallow: ["/"] },
      { userAgent: "Timpibot", disallow: ["/"] },
      { userAgent: "AI2Bot", disallow: ["/"] },
      { userAgent: "DuckAssistBot", disallow: ["/"] },
      { userAgent: "MistralAI-User", disallow: ["/"] },
      { userAgent: "*", allow: "/", disallow: ["/admin", "/api"] },
    ],
  },
};
