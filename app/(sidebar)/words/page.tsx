import type { Metadata } from "next";
import { readMarkdownFile } from "@/utils/content/markdown";
import { bodyOnlySchema } from "@/utils/content/schemas";
import { parseSayings } from "@/utils/content/sayings";
import { WORDS_MD } from "@/config/paths";
import { pageMetadata } from "@/utils/pageMetadata";
import { Sayings } from "./Sayings";

export const metadata: Metadata = pageMetadata({
  title: "words",
  description: "words from other people that stayed with me, by topic",
  path: "/words",
});

export const dynamic = "force-static";

export default function WordsPage() {
  const { content } = readMarkdownFile(WORDS_MD, bodyOnlySchema);
  return <Sayings title="words" topics={parseSayings(content)} />;
}
