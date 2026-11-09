import { Fragment } from "react";
import CourseRow from "@/components/syllabus/CourseRow";
import {
  ENROLLED_NIGHTS,
  courseCitation,
  dueParts,
  humanName,
  mergedCourse,
  paceProgress,
} from "@/lib/curriculum";

export default function EnrolledSchedule() {
  return (
    <ol className="m-0 list-none space-y-4 p-0">
      {ENROLLED_NIGHTS.map((night) => {
        const course = mergedCourse(night.courseId);
        const late = course?.late ?? 0;
        const missed = course?.missed ?? 0;
        // Short facts never break inside; only the work title may wrap.
        const facts = [
          courseCitation(night.courseId),
          paceProgress(night.courseId),
          ...dueParts(course),
        ].filter(Boolean);
        const counts = [
          late > 0 ? `${late} late` : "",
          missed > 0 ? `${missed} missed` : "",
        ].filter(Boolean);
        return (
          <li key={night.courseId}>
            <CourseRow
              href={`/syllabus/${night.courseId}`}
              day={night.day}
              title={course ? humanName(course) : night.courseId}
              track={night.track}
              meta={
                <>
                  {facts.map((fact, index) => {
                    const last = index === facts.length - 1;
                    // A separator stays on the line it ends, so a wrapped
                    // line never starts with one. Only the work title wraps.
                    return (
                      <Fragment key={fact}>
                        <span className={last ? "" : "whitespace-nowrap"}>
                          {fact}
                          {last ? "" : " ·"}
                        </span>
                        {last ? "" : " "}
                      </Fragment>
                    );
                  })}
                  {counts.map((count) => (
                    <Fragment key={count}>
                      {" · "}
                      <span className="whitespace-nowrap text-danger">
                        {count}
                      </span>
                    </Fragment>
                  ))}
                </>
              }
            />
          </li>
        );
      })}
    </ol>
  );
}
