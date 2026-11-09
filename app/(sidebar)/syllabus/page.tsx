import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/utils/pageMetadata";
import { Section } from "@/components/layout/Section";
import ActivityHeatmap from "@/components/syllabus/ActivityHeatmap";
import CourseRow from "@/components/syllabus/CourseRow";
import EnrolledSchedule from "@/components/syllabus/EnrolledSchedule";
import {
  SESSION_HOURS,
  UP_NEXT,
  courseCitation,
  humanName,
  mergedCourse,
} from "@/lib/curriculum";
import { data, plain } from "@/lib/syllabus";

export const metadata: Metadata = pageMetadata({
  title: "syllabus",
  description: "my RL gym: a place to train how I think",
  path: "/syllabus",
});

function countClass(n: number) {
  return n > 0 ? "text-danger" : undefined;
}

// Sections run in time order: what I have done, what I am taking, what
// comes next, then everything else.
export default function SyllabusPage() {
  const due = data.review?.due || [];
  const weak = data.review?.weak || [];
  const totals = data.totals || { hours: 0, sessions: 0, courses: 0 };
  const late = totals.late ?? 0;
  const missed = totals.missed ?? 0;
  const streak = totals.streak ?? 0;
  const dueLabel = due.length
    ? due.map((item) => plain(item.title || item.concept_id)).join(", ")
    : "nothing due";
  const weakLabel = weak.length
    ? weak.map((item) => plain(item.title || item.concept_id)).join(", ")
    : "none";

  return (
    <>
      <article className="prose">
        <h1>syllabus</h1>
        <p>
          my RL gym: I put in the reps, read the reward signal, and train how I
          think. <Link href={`/syllabus/about`}>learn more</Link>
        </p>
      </article>

      <div className="mt-12 space-y-12">
        <Section
          id="progress"
          title="progress"
          more={[{ href: `/syllabus/all#map`, label: "knowledge map" }]}
        >
          <ActivityHeatmap />
          <div className="mt-4 space-y-1 text-sm text-muted">
            <p className="m-0">
              {totals.hours ?? 0} hours · {totals.sessions ?? 0} sessions ·{" "}
              {totals.courses ?? 0} courses
            </p>
            <p className="m-0">
              <span className={countClass(late)}>{late} late</span>
              {" · "}
              <span className={countClass(missed)}>{missed} missed</span>
              {` · streak ${streak}`}
            </p>
            <p className="m-0">
              review: {dueLabel} · weak concepts: {weakLabel}
            </p>
          </div>
        </Section>

        <Section
          id="enrolled"
          title="enrolled this semester"
          note={`weeknights, ${SESSION_HOURS}, each due by 11:59pm that night`}
        >
          <EnrolledSchedule />
        </Section>

        <Section
          id="up-next"
          title="up next"
          more={[{ href: `/syllabus/all`, label: "all courses" }]}
        >
          <ul className="m-0 list-none space-y-4 p-0">
            {UP_NEXT.map((item) => {
              const course = mergedCourse(item.courseId);
              const citation = [
                courseCitation(item.courseId),
                "citationExtra" in item ? item.citationExtra : "",
              ]
                .filter(Boolean)
                .join(", ");
              return (
                <li key={item.courseId}>
                  <CourseRow
                    href={`/syllabus/${item.courseId}`}
                    title={course ? humanName(course) : item.courseId}
                    track={item.track}
                    meta={citation}
                  />
                </li>
              );
            })}
          </ul>
        </Section>
      </div>
    </>
  );
}
