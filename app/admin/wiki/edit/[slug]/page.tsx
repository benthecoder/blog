import { notFound } from "next/navigation";
import { getWikiEditorPage, WikiEditError } from "@/utils/content/wikiAdmin";
import { getLinkIndex } from "@/utils/content/links";
import WikiEditor from "./WikiEditor";

export const dynamic = "force-dynamic";

export default async function WikiEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ title?: string | string[] }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const initialTitle =
    slug === "new" && typeof query.title === "string"
      ? query.title.slice(0, 200)
      : "";
  let page = null;
  if (slug !== "new") {
    try {
      page = getWikiEditorPage(slug);
    } catch (error) {
      if (error instanceof WikiEditError) return notFound();
      throw error;
    }
  }
  return (
    <WikiEditor
      key={`${slug}:${initialTitle}`}
      initialTitle={initialTitle}
      initialPage={page}
      linkEntries={getLinkIndex().entries}
    />
  );
}
