import { NextResponse } from "next/server";
import { isSafeSlug } from "@/config/paths";
import { getPostMetadata } from "@/utils/content/posts";
import { getPostPreviewData } from "@/utils/content/preview";

// Prerendered per post so archive-page hover cards don't need every excerpt
// shipped in the page payload.
export const dynamic = "force-static";

export const generateStaticParams = async () => {
  return getPostMetadata().map((post) => ({ slug: post.slug }));
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
