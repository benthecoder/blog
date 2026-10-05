import { notFound } from "next/navigation";
import { getWikiEditorPage, WikiEditError } from "@/utils/content/wikiAdmin";
import { getLinkIndex } from "@/utils/content/links";
import WikiEditor from "./WikiEditor";

export const dynamic = "force-dynamic";

export default async function WikiEditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
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
      key={slug}
      initialPage={page}
      linkEntries={getLinkIndex().entries}
    />
  );
}
