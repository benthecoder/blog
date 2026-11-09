import type { Metadata } from "next";
import { pageMetadata } from "@/utils/pageMetadata";
import { SYLLABUS_PATH } from "@/config/syllabus";
import ActivityHeatmap from "@/components/syllabus/ActivityHeatmap";
import CurriculumMap from "@/components/syllabus/CurriculumMap";
import OptionalShelf from "@/components/syllabus/OptionalShelf";
import RequiredTracks from "@/components/syllabus/RequiredTracks";
import { formatDay, nodeStates, plain } from "@/lib/curriculum";
import { data } from "@/lib/syllabus";

export const metadata: Metadata = pageMetadata({
  title: "syllabus",
  description: "my RL gym: a place to train how I think",
  path: SYLLABUS_PATH,
});

export default function SyllabusPage() {
  const events = data.calendar?.events || [];
  const due = data.review?.due || [];
  const weak = data.review?.weak || [];
  const recent = data.feedback || [];
  const totals = data.totals || { hours: 0, sessions: 0, courses: 0 };
  const states = nodeStates();

  return (
    <article className="prose">
      <h1>syllabus</h1>
      <p>
        my RL gym: I put in the reps, read the reward signal, and train how I
        think.
      </p>
      <p className="text-sm text-accent/60 not-prose -mt-2 mb-6">
        Last updated: Nov 9, 2026
      </p>
      <ul>
        <li>
          I work by hand and stream the session, then link the recording here.
        </li>
        <li>
          I may ask a model questions. I never let it do the work for me, and
          the recording keeps me honest.
        </li>
        <li>
          After I finish a sheet, an LLM grades the handwriting, finds the weak
          concepts, and brings them back for spaced review.
        </li>
      </ul>

      <section className="not-prose mt-12">
        <h2 className="font-serif text-[1.5em] font-bold text-ink dark:text-chalk mt-0 mb-4">
          this week
        </h2>
        {events.length === 0 ? (
          <p className="text-[15px] text-ink-soft dark:text-chalk-soft">
            No class nights synced from the calendar yet.
          </p>
        ) : (
          <ol className="list-none p-0 m-0">
            {events.map((event) => (
              <li
                key={event.id || `${event.date}-${event.title}`}
                className="grid grid-cols-[6.75rem_1fr] gap-3 py-2.5 border-b border-rule dark:border-night-rule"
              >
                <span className="font-mono text-[12px] text-ink-muted">
                  {formatDay(event.date)}
                  {event.start ? (
                    <>
                      <br />
                      {event.start}
                    </>
                  ) : null}
                </span>
                <span className="text-[15px] text-ink-strong dark:text-chalk-strong">
                  {plain(event.title)}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <RequiredTracks />

      <section className="not-prose mt-12">
        <h2 className="font-serif text-[1.5em] font-bold text-ink dark:text-chalk mt-0 mb-4">
          review due
        </h2>
        {due.length === 0 ? (
          <p className="text-[15px] text-ink-soft dark:text-chalk-soft">
            Nothing is due. Cards appear here after a sheet is graded.
          </p>
        ) : (
          <ul className="list-disc pl-5">
            {due.map((item) => (
              <li key={item.concept_id || item.title} className="text-[15px]">
                {plain(item.title || item.concept_id)}
              </li>
            ))}
          </ul>
        )}
        <h3 className="font-serif text-[1.15em] font-bold text-ink dark:text-chalk mt-8 mb-3">
          weak concepts
        </h3>
        {weak.length === 0 ? (
          <p className="text-[15px] text-ink-soft dark:text-chalk-soft">
            No weak concepts yet.
          </p>
        ) : (
          <ul className="list-disc pl-5">
            {weak.map((item) => (
              <li key={item.concept_id || item.title} className="text-[15px]">
                {plain(item.title || item.concept_id)}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="not-prose mt-12">
        <h2 className="font-serif text-[1.5em] font-bold text-ink dark:text-chalk mt-0 mb-3">
          activity
        </h2>
        <ActivityHeatmap />
      </section>

      <section className="not-prose mt-12">
        <h2 className="font-serif text-[1.5em] font-bold text-ink dark:text-chalk mt-0 mb-3">
          knowledge map
        </h2>
        <p className="text-[15px] text-ink-soft dark:text-chalk-soft mb-5">
          Concepts, not course codes. The required tracks sit in full color.
          Everything else on the shelf can be opened with the whole map.
        </p>
        <CurriculumMap states={states} />
      </section>

      <OptionalShelf />

      <section className="not-prose mt-12">
        <h2 className="font-serif text-[1.5em] font-bold text-ink dark:text-chalk mt-0 mb-4">
          recent graded work
        </h2>
        {recent.length === 0 ? (
          <p className="text-[15px] text-ink-soft dark:text-chalk-soft">
            No graded work yet.
          </p>
        ) : (
          <ul className="list-none p-0 m-0">
            {recent.map((row, index) => (
              <li
                key={`${row.course_id}-${row.problem_ref}-${index}`}
                className="py-2.5 border-b border-rule dark:border-night-rule"
              >
                <p className="m-0 text-[15px] text-ink-strong dark:text-chalk-strong">
                  {plain(row.problem_ref || "problem")}
                </p>
                <p className="m-0 mt-1 text-[13px] text-ink-muted">
                  {plain([row.status, row.summary].filter(Boolean).join(" · "))}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="not-prose mt-16 pt-5 border-t border-rule dark:border-night-rule text-[13px] italic text-ink-muted">
        {totals.hours ?? 0} hours · {totals.sessions ?? 0} sessions ·{" "}
        {totals.courses ?? 0} courses
      </footer>
    </article>
  );
}
