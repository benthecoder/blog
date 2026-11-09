import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/utils/pageMetadata";
import { Section } from "@/components/layout/Section";
import CurriculumMap from "@/components/syllabus/CurriculumMap";
import TopicsList from "@/components/syllabus/TopicsList";
import { nodeLevels } from "@/lib/curriculum";

export const metadata: Metadata = pageMetadata({
  title: "topics and interests",
  description: "the rest of the shelf, and a map of the concepts",
  path: `/syllabus/all`,
});

export default function SyllabusAllPage() {
  return (
    <>
      <article className="prose">
        <h1>topics and interests</h1>
        <p>
          <Link href="/syllabus">syllabus</Link>
        </p>
      </article>

      <div className="mt-12 space-y-12">
        <Section id="courses" title="courses">
          <TopicsList />
        </Section>
        <Section
          id="map"
          title="knowledge map"
          note="mastery 0–5, earned only by graded work"
        >
          <CurriculumMap levels={nodeLevels()} />
        </Section>
      </div>
    </>
  );
}
