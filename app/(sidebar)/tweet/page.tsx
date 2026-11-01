import { redirect } from "next/navigation";

export default function TweetPage() {
  redirect("/thoughts/new");
}
