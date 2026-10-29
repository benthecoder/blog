import policies from "@/config/crawlerPolicies";

type Policy = { userAgent: string; allow?: string; disallow?: string[] };

// Same layout next-sitemap prints for the main site's robots.txt.
export function buildRobotsTxt(host: string): string {
  const blocks = (policies as Policy[]).map(
    ({ userAgent, allow, disallow = [] }) =>
      [
        `# ${userAgent}`,
        `User-agent: ${userAgent}`,
        ...(allow ? [`Allow: ${allow}`] : []),
        ...disallow.map((path) => `Disallow: ${path}`),
      ].join("\n")
  );
  return [
    ...blocks.flatMap((block) => [block, ""]),
    `# Host`,
    `Host: https://${host}`,
    ``,
    `# Sitemaps`,
    `Sitemap: https://${host}/sitemap.xml`,
    ``,
  ].join("\n");
}
