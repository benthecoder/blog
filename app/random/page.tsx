import { redirect } from "next/navigation";
import { getPostMetadata } from "@/utils/content/posts";

export const dynamic = "force-dynamic";

export default function RandomPage() {
  const posts = getPostMetadata();
  const random = posts[Math.floor(Math.random() * posts.length)];
  redirect(`/posts/${random.slug}`);
}
