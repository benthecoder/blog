/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_ROOT_URL || "https://bneo.xyz",
  generateRobotsTxt: true,
  exclude: ["/admin", "/admin/*"],
  robotsTxtOptions: {
    policies: [
      // AI crawlers: no scraping, no training data. Named individually
      // because the wildcard group below is an allow.
      {
        userAgent: [
          "GPTBot",
          "OAI-SearchBot",
          "ChatGPT-User",
          "ClaudeBot",
          "Claude-SearchBot",
          "Claude-User",
          "anthropic-ai",
          "CCBot",
          "Google-Extended",
          "Applebot-Extended",
          "Meta-ExternalAgent",
          "Meta-ExternalFetcher",
          "Bytespider",
          "PerplexityBot",
          "Perplexity-User",
          "cohere-ai",
          "Diffbot",
          "Omgilibot",
          "ImagesiftBot",
          "Timpibot",
          "AI2Bot",
          "DuckAssistBot",
          "MistralAI-User",
        ],
        disallow: ["/"],
      },
      { userAgent: "*", allow: "/", disallow: ["/admin", "/api"] },
    ],
  },
};
