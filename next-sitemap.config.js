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
    "/thoughts/rss.xml",
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
