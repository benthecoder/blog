/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_ROOT_URL || "https://bneo.xyz",
  generateRobotsTxt: true,
  exclude: ["/admin", "/admin/*"],
  robotsTxtOptions: {
    policies: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api"] }],
  },
};
