import Link from "next/link";
import { SYLLABUS_PATH } from "@/config/syllabus";
import {
  ENROLLED_NIGHTS,
  SESSION_HOURS,
  courseLevel,
  displayTitle,
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
          const title = course ? displayTitle(course) : night.courseId;
          const level = courseLevel(course);
          return (
            <li key={night.courseId}>
              <Link
                href={`${SYLLABUS_PATH}/${night.courseId}`}
                className="grid grid-cols-[2.75rem_1fr_auto] sm:grid-cols-[2.75rem_6.5rem_1fr_auto] gap-x-3 gap-y-1 py-3 border-b border-rule dark:border-night-rule no-underline text-ink-strong dark:text-chalk-strong"
              >
                <span className="font-mono text-[12px] text-ink-muted pt-0.5">
                  {night.day}
                </span>
                <span className="hidden sm:block font-mono text-[12px] text-ink-muted pt-0.5">
                  {SESSION_HOURS}
                </span>
                <span>
                  <span className="block text-[15px]">{title}</span>
                  <span className="sm:hidden block font-mono text-[12px] text-ink-muted mt-1">
                    {SESSION_HOURS}
                  </span>
                  <span className="block font-mono text-[12px] text-ink-muted mt-1">
                    {skillBar(level)}
                  </span>
                </span>
                <span className="self-start font-mono text-[11px] tracking-[0.04em] uppercase text-ink-muted border border-rule dark:border-night-rule px-1.5 py-0.5">
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
