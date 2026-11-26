import { Metadata } from "next";
import ThoughtsClient from "./ThoughtsClient";
import { pageMetadata } from "@/utils/pageMetadata";
import { loadThoughts } from "@/utils/loadThoughts";

// ISR requires the Node runtime; Edge ignored the hourly revalidation.
export const dynamic = "force-static";
export const revalidate = 3600;

export const metadata: Metadata = pageMetadata({
  title: "thoughts",
  description: "unfiltered thoughts, stream of consciousness",
  path: "/thoughts",
});

const INITIAL_LIMIT = 100;

export default async function ThoughtsPage() {
  const thoughts = await loadThoughts({ limit: INITIAL_LIMIT });
  return <ThoughtsClient initialThoughts={thoughts} />;
}
