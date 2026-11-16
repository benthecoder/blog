import type { Metadata } from "next";
import { readMarkdownFile } from "@/utils/content/markdown";
import { bodyOnlySchema } from "@/utils/content/schemas";
import { parseSayings } from "@/utils/content/sayings";
import { VERSES_MD } from "@/config/paths";
import { pageMetadata } from "@/utils/pageMetadata";
import { Sayings } from "../words/Sayings";

export const metadata: Metadata = pageMetadata({
  title: "verses",
  description: "bible verses i hold onto, by topic",
  path: "/verses",
});

export const dynamic = "force-static";

export default function VersesPage() {
  const { content } = readMarkdownFile(VERSES_MD, bodyOnlySchema);
  return <Sayings title="verses" topics={parseSayings(content)} />;
}
