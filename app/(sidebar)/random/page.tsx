import { redirect } from "next/navigation";
import { getPostSlugs } from "@/utils/content/posts";

// Has to stay dynamic — the whole point is a different answer each request —
// but it only needs a filename. It used to call getPostMetadata(), which reads
// and parses every post on disk to pick one of their slugs.
export const dynamic = "force-dynamic";

export default function RandomPage() {
  const slugs = getPostSlugs();
  if (!slugs.length) redirect("/posts");
  redirect(`/posts/${slugs[Math.floor(Math.random() * slugs.length)]}`);
}
