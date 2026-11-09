import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/utils/pageMetadata";
import { SYLLABUS_PATH } from "@/config/syllabus";
import ActivityHeatmap from "@/components/syllabus/ActivityHeatmap";
import EnrolledSchedule from "@/components/syllabus/EnrolledSchedule";
import {
  UP_NEXT,
  courseCitation,
  humanName,
  mergedCourse,
  plain,
} from "@/lib/curriculum";
import { data } from "@/lib/syllabus";

export const metadata: Metadata = pageMetadata({
  title: "syllabus",
  description: "my RL gym: a place to train how I think",
  path: SYLLABUS_PATH,
});

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
    <article className="prose">
      <h1>syllabus</h1>
      <p>
        my RL gym: I put in the reps, read the reward signal, and train how I
        think. <Link href={`${SYLLABUS_PATH}/about`}>learn more</Link>
      </p>

      <section className="not-prose mt-10">
        <h2 className="font-serif text-[1.5em] font-bold text-ink dark:text-chalk mt-0 mb-3">
          progress
        </h2>
        <ActivityHeatmap />
        <p className="mt-3 mb-0 text-[13px] text-ink-muted">
          {totals.hours ?? 0} hours · {totals.sessions ?? 0} sessions ·{" "}
          {totals.courses ?? 0} courses
        </p>
        <p className="mt-2 mb-0 text-[13px] text-ink-muted">
          <span className={late > 0 ? "text-danger" : undefined}>
            {late} late
          </span>
          {" · "}
          <span className={missed > 0 ? "text-danger" : undefined}>
            {missed} missed
          </span>
          {` · streak ${streak}`}
        </p>
        <p className="mt-3 mb-0 flex flex-wrap gap-x-8 gap-y-1 text-[13px] text-ink-muted">
          <span>review due · {dueLabel}</span>
          <span>weak concepts · {weakLabel}</span>
        </p>
      </section>

      <EnrolledSchedule />

      <section className="not-prose mt-12">
        <h2 className="font-serif text-[1.5em] font-bold text-ink dark:text-chalk mt-0 mb-4">
          up next
        </h2>
        <ul className="list-none p-0 m-0">
          {UP_NEXT.map((item) => {
            const course = mergedCourse(item.courseId);
            const title = course ? humanName(course) : item.courseId;
            const citation = [
              courseCitation(item.courseId),
              "citationExtra" in item ? item.citationExtra : "",
            ]
              .filter(Boolean)
              .join(", ");
            return (
              <li key={item.courseId}>
                <Link
                  href={`${SYLLABUS_PATH}/${item.courseId}`}
                  style={{ backgroundImage: "none" }}
                  className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5 py-2 no-underline text-ink-strong dark:text-chalk-strong"
                >
                  <span className="min-w-0">
                    <span className="block text-[15px]">{title}</span>
                    {citation ? (
                      <span className="block text-[12px] text-ink-muted mt-0.5">
                        {citation}
                      </span>
                    ) : null}
                    <span className="sm:hidden block text-[12px] text-ink-muted mt-0.5">
                      {item.track}
                    </span>
                  </span>
                  <span className="hidden sm:block text-[12px] text-ink-muted self-start pt-0.5">
                    {item.track}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        <p className="mt-4 mb-0">
          <Link
            href={`${SYLLABUS_PATH}/all`}
            className="text-[14px] text-ink-strong dark:text-chalk-strong"
          >
            more →
          </Link>
        </p>
      </section>
    </article>
  );
}
