import { HomeScreen } from "@/components/home/HomeScreen";
import { getPostSlugs } from "@/utils/content/posts";

export const dynamic = "force-static";

export default function HomePage() {
  return <HomeScreen postCount={getPostSlugs().length} />;
}
