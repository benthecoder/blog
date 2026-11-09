import type { Metadata } from "next";
import { pageMetadata } from "@/utils/pageMetadata";
import { SYLLABUS_PATH } from "@/config/syllabus";
import ActivityHeatmap from "@/components/syllabus/ActivityHeatmap";
import CourseCard from "@/components/syllabus/CourseCard";
import KnowledgeMapSlot from "@/components/syllabus/KnowledgeMapSlot";
import { data, isEnrolled, plain, trackOf, type Course } from "@/lib/syllabus";

export const metadata: Metadata = pageMetadata({
  title: "syllabus",
  description: "my RL gym: a place to train how I think",
  path: SYLLABUS_PATH,
});

const TRACK_LABEL: Record<string, string> = {
  core: "Core",
  major: "Major",
  minor: "Minors",
};

function groupByTrack(courses: Course[]) {
  const groups: { key: string; label: string; courses: Course[] }[] = [
    { key: "core", label: TRACK_LABEL.core, courses: [] },
    { key: "major", label: TRACK_LABEL.major, courses: [] },
    { key: "minor", label: TRACK_LABEL.minor, courses: [] },
  ];
  for (const course of courses) {
    const key = trackOf(course);
    const group = groups.find((item) => item.key === key);
    if (group) group.courses.push(course);
  }
  return groups.filter((group) => group.courses.length > 0);
}

function formatDay(iso?: string) {
  if (!iso) return "";
  const date = new Date(`${iso}T12:00:00`);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "America/New_York",
  });
}

export default function SyllabusPage() {
  const courses = data.curriculum || [];
  const current = courses.filter(isEnrolled);
  const future = courses.filter((course) => !isEnrolled(course));
  const events = data.calendar?.events || [];
  const due = data.review?.due || [];
  const weak = data.review?.weak || [];
  const recent = data.feedback || [];
  const totals = data.totals || {
    hours: 0,
    sessions: 0,
    courses: current.length,
  };

  return (
    <article className="prose">
      <h1>syllabus</h1>
      <p>
        my RL gym: I put in the reps, read the reward signal, and train how I
        think.
      </p>
      <p className="text-sm text-accent/60 not-prose -mt-2 mb-8">
        Last updated: Nov 8, 2026
      </p>

      <h2>methodology</h2>
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

      <section className="not-prose mt-10">
        <h2 className="font-serif text-[1.5em] font-bold text-ink dark:text-chalk mt-0 mb-3">
          activity
        </h2>
        <ActivityHeatmap />
      </section>

      <section className="not-prose mt-12">
        <h2 className="font-serif text-[1.5em] font-bold text-ink dark:text-chalk mt-0 mb-4">
          current classes
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {current.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </section>

      <section className="not-prose mt-12">
        <h2 className="font-serif text-[1.5em] font-bold text-ink dark:text-chalk mt-0 mb-2">
          future classes
        </h2>
        <p className="text-[15px] text-ink-soft dark:text-chalk-soft mb-6">
          Courses in the catalog that I have not enrolled in yet.
        </p>
        {groupByTrack(future).map((group) => (
          <div key={group.key} className="mb-8">
            <h3 className="font-mono text-2xs tracking-[0.14em] uppercase text-ink-muted mt-0 mb-3">
              {group.label}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {group.courses.map((course) => (
                <CourseCard key={course.id} course={course} future />
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="not-prose mt-12">
        <h2 className="font-serif text-[1.5em] font-bold text-ink dark:text-chalk mt-0 mb-4">
          schedule
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
                </span>
                <span className="text-[15px] text-ink-strong dark:text-chalk-strong">
                  {event.start ? `${event.start} · ` : ""}
                  {plain(event.title)}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>

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

      <KnowledgeMapSlot />

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
        {totals.courses ?? current.length} courses
      </footer>
    </article>
  );
}
