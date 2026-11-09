import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/utils/pageMetadata";
import { SYLLABUS_PATH } from "@/config/syllabus";
import CurriculumMap from "@/components/syllabus/CurriculumMap";
import TopicsList from "@/components/syllabus/TopicsList";
import { nodeLevels } from "@/lib/curriculum";

export const metadata: Metadata = pageMetadata({
  title: "topics and interests",
  description: "the rest of the shelf, and a map of the concepts",
  path: `${SYLLABUS_PATH}/all`,
});

export default function SyllabusAllPage() {
  return (
    <article className="prose">
      <h1>topics and interests</h1>
      <p>
        <Link href={SYLLABUS_PATH}>← syllabus</Link>
      </p>
      <TopicsList heading={null} />
      <section className="not-prose mt-12">
        <h2 className="font-serif text-[1.5em] font-bold text-ink dark:text-chalk mt-0 mb-4">
          knowledge map
        </h2>
        <CurriculumMap levels={nodeLevels()} />
      </section>
    </article>
  );
}
