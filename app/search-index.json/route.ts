import { buildSearchDocuments } from "@/utils/content/searchIndex";

// Built once per deployment and served as a static asset, with no database call.
export const dynamic = "force-static";

export function GET() {
  return Response.json(buildSearchDocuments(), {
    headers: { "Cache-Control": "public, max-age=0, must-revalidate" },
  });
}
