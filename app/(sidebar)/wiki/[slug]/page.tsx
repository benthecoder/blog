import { permanentRedirect } from "next/navigation";

export default async function RetiredEntry({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  permanentRedirect(`/posts/${encodeURIComponent(slug)}`);
}
