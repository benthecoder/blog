import { describe, expect, it } from "vitest";
import policies from "@/config/crawlerPolicies";
import { buildRobotsTxt } from "./subdomainRobots";

describe("buildRobotsTxt", () => {
  const txt = buildRobotsTxt("photos.bneo.xyz");

  it("keeps every shared AI-crawler disallow", () => {
    for (const { userAgent, disallow } of policies.filter(
      (p) => p.userAgent !== "*"
    )) {
      expect(txt).toContain(
        `# ${userAgent}\nUser-agent: ${userAgent}\nDisallow: ${disallow[0]}\n`
      );
    }
  });

  it("prints the wildcard policy with allow before disallow", () => {
    expect(txt).toContain(
      "User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api\n"
    );
  });

  it("points host and sitemap at the subdomain", () => {
    expect(txt).toContain("# Host\nHost: https://photos.bneo.xyz\n");
    expect(txt).toContain(
      "# Sitemaps\nSitemap: https://photos.bneo.xyz/sitemap.xml\n"
    );
    expect(txt).not.toContain("https://bneo.xyz");
  });
});
