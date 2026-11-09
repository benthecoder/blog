import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { pageMetadata } from "@/utils/pageMetadata";
import { SYLLABUS_PATH } from "@/config/syllabus";
import {
  allCourseIds,
  catalogItem,
  courseCitation,
  courseLevel,
  courseUrl,
  formatDay,
  hoursLabel,
  humanName,
  lastScore,
  mergedCourse,
  plain,
  progressText,
  skillBar,
  weekEvent,
  weekSessionLabel,
} from "@/lib/curriculum";
import { data, progressRatio, type Course } from "@/lib/syllabus";

type Params = Promise<{ course: string }>;

export function generateStaticParams() {
  return allCourseIds().map((id) => ({ course: id }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { course: id } = await params;
  const course = mergedCourse(id);
  if (!course) return pageMetadata({ title: "syllabus", path: SYLLABUS_PATH });
  return pageMetadata({
    title: humanName(course),
    description: plain(course.title || humanName(course)),
    path: `${SYLLABUS_PATH}/${id}`,
  });
}

function assignmentsFor(course: Course) {
  const lesson = (data.current_week?.lessons || []).find(
    (item) => item.course_id === course.id
  );
  const fromLesson = (lesson?.problems || []).map((problem) => ({
    ref: problem.ref || "problem",
    status: problem.status || "issued",
    score:
      problem.status === "certified" || problem.status === "correct"
        ? problem.status
        : null,
    feedback: problem.feedback,
  }));
  if (fromLesson.length) return fromLesson;
  return (data.feedback || [])
    .filter((row) => row.course_id === course.id)
    .map((row) => ({
      ref: row.problem_ref || "problem",
      status: row.status || "issued",
      score: row.status,
      feedback: row.summary,
    }));
}

export default async function CoursePage({ params }: { params: Params }) {
  const { course: id } = await params;
  const course = mergedCourse(id);
  if (!course) notFound();

  const catalog = catalogItem(id);
  const assignments = assignmentsFor(course);
  const feedback = (data.feedback || []).filter(
    (row) => row.course_id === course.id && row.summary
  );
  const weak = (data.review?.weak || []).filter(
    (item) => !item.course_id || item.course_id === course.id
  );
  const streams = (data.streams || []).filter(
    (item) => !item.course_id || item.course_id === course.id
  );
  const ratio = progressRatio(course);
  const units = course.units || [];
  const url = courseUrl(id);
  const session = weekSessionLabel(id);
  const event = weekEvent(id);
  const hours = hoursLabel(id);
  const recommenders = catalog?.recommended_by || [];

  return (
    <article className="prose">
      <p className="not-prose text-sm mb-6">
        <Link href={SYLLABUS_PATH}>syllabus</Link>
      </p>
      <p className="text-[13px] text-ink-muted not-prose m-0">
        {courseCitation(id)}
        {hours ? `${courseCitation(id) ? " · " : ""}${hours}` : ""}
      </p>
      <h1>{humanName(course)}</h1>
      {url ? (
        <p>
          <a href={url}>source</a>
        </p>
      ) : null}
      {session ? (
        <p>
          This week
          {event?.date ? ` (${formatDay(event.date)})` : ""}: {session}
        </p>
      ) : null}

      <section className="not-prose mt-8">
        <p className="font-mono text-2xs tracking-[0.08em] uppercase text-ink-muted m-0 mb-2">
          {progressText(course)} · {lastScore(course.id)}
        </p>
        <p className="font-mono text-[12px] text-ink-muted m-0 mb-2">
          mastery {skillBar(courseLevel(course))}
        </p>
        <div className="h-0.5 bg-paper-sunken dark:bg-night-raised">
          <i
            className="block h-full bg-ink dark:bg-chalk"
            style={{ width: `${Math.round(ratio * 100)}%` }}
          />
        </div>
      </section>

      {catalog?.why_canonical ? (
        <>
          <h2>why this</h2>
          <p>{plain(catalog.why_canonical)}</p>
        </>
      ) : null}

      {recommenders.length > 0 ? (
        <>
          <h2>recommended by</h2>
          <ul>
            {recommenders.map((row) => (
              <li key={row.name}>
                {row.url ? <a href={row.url}>{row.name}</a> : row.name}
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <h2>units</h2>
      {units.length === 0 ? (
        <p>No units listed yet.</p>
      ) : (
        <ul>
          {units.map((unit) => (
            <li key={unit.id || unit.title}>
              {plain(unit.title || unit.id || "unit")}
            </li>
          ))}
        </ul>
      )}

      <h2>assignments</h2>
      {assignments.length === 0 ? (
        <p>No assignments issued yet.</p>
      ) : (
        <ul>
          {assignments.map((item) => (
            <li key={item.ref}>
              {plain(item.ref)} · {plain(item.status)}
              {item.score ? ` · ${plain(item.score)}` : ""}
            </li>
          ))}
        </ul>
      )}

      <h2>feedback</h2>
      {feedback.length === 0 ? (
        <p>No grader notes yet.</p>
      ) : (
        <ul>
          {feedback.map((row, index) => (
            <li key={`${row.problem_ref}-${index}`}>
              {plain(row.problem_ref || "problem")}: {plain(row.summary)}
            </li>
          ))}
        </ul>
      )}

      <h2>weak concepts</h2>
      {weak.length === 0 ? (
        <p>No weak concepts yet.</p>
      ) : (
        <ul>
          {weak.map((item) => (
            <li key={item.concept_id || item.title}>
              {plain(item.title || item.concept_id)}
            </li>
          ))}
        </ul>
      )}

      <h2>streams</h2>
      {streams.length === 0 ? (
        <p>No recordings linked yet.</p>
      ) : (
        <ul>
          {streams.map((item) => (
            <li key={item.url}>
              <a href={item.url}>{plain(item.title || item.url)}</a>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
