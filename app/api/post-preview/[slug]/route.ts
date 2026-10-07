import { NextResponse } from "next/server";
import { isSafeSlug } from "@/config/paths";
import { getPostPreviewData } from "@/utils/content/preview";

// Generate and cache a preview on its first request. Full articles remain
// prerendered, but deployments needn't build an endpoint for every hover card.
export const dynamic = "force-static";
export const dynamicParams = true;

export const generateStaticParams = async () => {
  return [];
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const preview = isSafeSlug(slug) ? getPostPreviewData(slug) : null;
  if (!preview) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(preview);
}
