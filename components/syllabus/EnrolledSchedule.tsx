import Link from "next/link";
import { SYLLABUS_PATH } from "@/config/syllabus";
import {
  ENROLLED_NIGHTS,
  SESSION_HOURS,
  courseCitation,
  courseLevel,
  humanName,
  mergedCourse,
  skillBar,
} from "@/lib/curriculum";

export default function EnrolledSchedule() {
  return (
    <section className="not-prose mt-12">
      <h2 className="font-serif text-[1.5em] font-bold text-ink dark:text-chalk mt-0 mb-4">
        enrolled this semester
      </h2>
      <ol className="list-none p-0 m-0">
        {ENROLLED_NIGHTS.map((night) => {
          const course = mergedCourse(night.courseId);
          const title = course ? humanName(course) : night.courseId;
          const citation = courseCitation(night.courseId);
          const level = courseLevel(course);
          return (
            <li key={night.courseId}>
              <Link
                href={`${SYLLABUS_PATH}/${night.courseId}`}
                style={{ backgroundImage: "none" }}
                className="grid grid-cols-[2.75rem_1fr] sm:grid-cols-[2.75rem_6.5rem_1fr_auto] gap-x-3 gap-y-0.5 py-3 no-underline text-ink-strong dark:text-chalk-strong"
              >
                <span className="font-mono text-[12px] text-ink-muted pt-0.5">
                  {night.day}
                </span>
                <span className="hidden sm:block font-mono text-[12px] text-ink-muted pt-0.5">
                  {SESSION_HOURS}
                </span>
                <span className="min-w-0">
                  <span className="block text-[15px]">{title}</span>
                  {citation ? (
                    <span className="block text-[12px] text-ink-muted mt-0.5">
                      {citation}
                    </span>
                  ) : null}
                  <span className="sm:hidden block text-[12px] text-ink-muted mt-0.5">
                    {SESSION_HOURS} · {night.track}
                  </span>
                  <span className="block font-mono text-[12px] text-ink-muted mt-1 whitespace-nowrap">
                    {skillBar(level)}
                  </span>
                </span>
                <span className="hidden sm:block text-[12px] text-ink-muted self-start pt-0.5">
                  {night.track}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
