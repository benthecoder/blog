/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_ROOT_URL || "https://bneo.xyz",
  generateRobotsTxt: true,
  exclude: ["/admin", "/admin/*"],
  robotsTxtOptions: {
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
