import type { Metadata } from "next";
import { readMarkdownFile } from "@/utils/content/markdown";
import { bodyOnlySchema } from "@/utils/content/schemas";
import { parseBeliefs } from "@/utils/content/beliefs";
import { BELIEVE_MD } from "@/config/paths";
import { pageMetadata } from "@/utils/pageMetadata";

export const metadata: Metadata = pageMetadata({
  title: "Things I Believe",
  description: "some things i believe",
  path: "/believe",
});

export const dynamic = "force-static";

/** Each belief in bold, with the reasons under it quieter, in the shape of
    nat.org's "some things I believe". */
export default function BelievePage() {
  const { content } = readMarkdownFile(BELIEVE_MD, bodyOnlySchema);
  return (
    <div className="text-base leading-relaxed">
      <h1 className="text-2xl font-bold text-primary">Things I Believe</h1>
      <ul className="mt-8 max-w-[65ch] space-y-6">
        {parseBeliefs(content).map((belief) => (
          <li key={belief.text}>
            <p className="font-bold text-primary">{belief.text}</p>
            {belief.reasons.length > 0 && (
              <ul className="mt-1 space-y-1 text-muted">
                {belief.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
