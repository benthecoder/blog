import { redirect } from "next/navigation";
import getPostMetadata from "@/utils/getPostMetadata";

export default function RandomPage() {
  const posts = getPostMetadata();
  const random = posts[Math.floor(Math.random() * posts.length)];
  redirect(`/posts/${random.slug}`);
}
