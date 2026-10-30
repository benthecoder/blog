import { redirect } from "next/navigation";

export default async function RetiredAdminEditor({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/admin/edit/${encodeURIComponent(slug)}`);
}
