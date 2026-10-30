import { buildRobotsTxt } from "@/utils/subdomainRobots";

export const dynamic = "force-static";

// Served as photos.bneo.xyz/robots.txt (see rewrites in next.config.ts).
export function GET() {
  return new Response(buildRobotsTxt("photos.bneo.xyz"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
