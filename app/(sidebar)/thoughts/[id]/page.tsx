import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ThoughtBody from "@/components/thoughts/ThoughtBody";
import CopyThoughtLink from "@/components/thoughts/CopyThoughtLink";
import { pageMetadata } from "@/utils/pageMetadata";
import { loadThought, loadThoughts } from "@/utils/loadThoughts";
import {
  parseThoughtId,
  thoughtDateFormatter,
  thoughtShareText,
  thoughtTimeFormatter,
} from "@/utils/thoughtShare";

// ISR requires the Node runtime; Edge ignored the hourly revalidation.
export const dynamic = "force-static";
export const revalidate = 3600;
export const dynamicParams = true;

type Params = Promise<{ id: string }>;

export async function generateStaticParams() {
  try {
    const thoughts = await loadThoughts({ limit: 100 });
    return thoughts.map((thought) => ({ id: String(thought.id) }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata | undefined> {
  const id = parseThoughtId((await params).id);
  if (id == null) return;
  const thought = await loadThought(id);
  if (!thought) return;
  return pageMetadata({
    title: thoughtShareText(thought),
    description: "a thought",
    path: `/thoughts/${id}`,
  });
}

export default async function ThoughtPage({ params }: { params: Params }) {
  const id = parseThoughtId((await params).id);
  if (id == null) notFound();
  const thought = await loadThought(id);
  if (!thought) notFound();

  const created = new Date(thought.created_at);
  const date = thoughtDateFormatter.format(created);
  const time = thoughtTimeFormatter.format(created);

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <Link
        href="/thoughts"
        className="text-sm text-muted hover:text-accent underline underline-offset-4"
      >
        ← thoughts
      </Link>
      <div className="mt-8 mb-2 pb-2 border-b border-rule dark:border-chalk-muted/30">
        <p className="text-xs text-muted tracking-wide lowercase text-center">
          {date}
        </p>
      </div>
      <div className="flex gap-4 items-baseline">
        <span className="text-xs text-muted shrink-0 w-10">{time}</span>
        <ThoughtBody
          content={thought.content}
          link={thought.link ?? null}
          titles={thought.titles ?? {}}
        />
      </div>
      <div className="mt-6 pl-14">
        <CopyThoughtLink id={thought.id} />
      </div>
    </div>
  );
}
