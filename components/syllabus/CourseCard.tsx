import Link from "next/link";
import { SYLLABUS_PATH } from "@/config/syllabus";
import {
  currentUnit,
  displayTitle,
  lastScore,
  plain,
  progressLabel,
  progressRatio,
  type Course,
} from "@/lib/syllabus";

export default function CourseCard({
  course,
  future = false,
}: {
  course: Course;
  future?: boolean;
}) {
  const ratio = progressRatio(course);
  return (
    <Link
      href={`${SYLLABUS_PATH}/${course.id}`}
      className={`no-underline flex flex-col min-h-[168px] p-3.5 border bg-paper dark:bg-night ${
        future
          ? "border-dashed border-ink-muted/40 opacity-90"
          : "border-solid border-rule dark:border-night-rule"
      }`}
    >
      <p className="font-mono text-2xs tracking-[0.14em] uppercase text-ink-muted m-0">
        {plain(course.institution || course.area || "")}
      </p>
      <h3 className="font-normal text-[20px] leading-[1.15] text-ink dark:text-chalk mt-2.5 mb-1">
        {displayTitle(course)}
      </h3>
      <p className="text-[13px] text-ink-soft dark:text-chalk-soft flex-1 m-0">
        {plain(course.title || "")}
      </p>
      {future ? (
        <p className="font-mono text-2xs tracking-[0.08em] uppercase text-ink-muted mt-3 mb-0">
          not enrolled
        </p>
      ) : (
        <>
          <p className="text-[13px] text-ink-soft dark:text-chalk-soft mt-3 mb-0">
            {currentUnit(course)}
          </p>
          <p className="text-[13px] text-ink-muted mt-1 mb-0">
            {lastScore(course.id)}
          </p>
          <div className="flex justify-between items-baseline mt-3">
            <span className="font-mono text-2xs tracking-[0.08em] uppercase text-ink-muted">
              {progressLabel(course)} certified
            </span>
          </div>
          <div className="h-0.5 bg-paper-sunken dark:bg-night-raised mt-2">
            <i
              className="block h-full bg-ink dark:bg-chalk"
              style={{ width: `${Math.round(ratio * 100)}%` }}
            />
          </div>
        </>
      )}
    </Link>
  );
}
