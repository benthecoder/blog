import type { Metadata } from "next";
import { readMarkdownFile } from "@/utils/content/markdown";
import { bodyOnlySchema } from "@/utils/content/schemas";
import { BELIEVE_MD } from "@/config/paths";
import { pageMetadata } from "@/utils/pageMetadata";

export const metadata: Metadata = pageMetadata({
  title: "Things I Believe",
  description: "some things i believe",
  path: "/believe",
});

export const dynamic = "force-static";

export default function BelievePage() {
  const { content } = readMarkdownFile(BELIEVE_MD, bodyOnlySchema);
  const beliefs = content
    .trim()
    .split("\n")
    .map((line) => line.replace(/^- /, ""));
  return (
    <div className="text-base leading-relaxed">
      <h1 className="text-2xl font-bold text-primary">Things I Believe</h1>
      <ul className="mt-8 max-w-[65ch] list-disc space-y-3 pl-5 text-primary marker:text-muted">
        {beliefs.map((belief) => (
          <li key={belief} className="pl-1">
            {belief}
          </li>
        ))}
      </ul>
    </div>
  );
}
