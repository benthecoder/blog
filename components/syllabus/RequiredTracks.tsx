import Link from "next/link";
import { SYLLABUS_PATH } from "@/config/syllabus";
import {
  REQUIRED_TRACKS,
  catalogItem,
  courseUrl,
  displayTitle,
  formatDay,
  hoursLabel,
  lastScore,
  mergedCourse,
  oneLiner,
  progressText,
  schoolOf,
  unitText,
  weekEvent,
  weekSessionLabel,
  type TrackDef,
} from "@/lib/curriculum";

function CourseBlock({ id, kind }: { id: string; kind: "now" | "next" }) {
  const course = mergedCourse(id);
  const catalog = catalogItem(id);
  const title =
    catalog?.title || course?.title || (course ? displayTitle(course) : id);
  const url = courseUrl(id);
  const session = weekSessionLabel(id);
  const event = weekEvent(id);
  const unit = course ? unitText(course) : "";
  const hours = hoursLabel(id);
  const school = schoolOf(id);
  const line = oneLiner(id);

  return (
    <div className="mt-4">
      <p className="font-mono text-2xs tracking-[0.14em] uppercase text-ink-muted m-0">
        {kind}
      </p>
      <h4 className="font-normal text-[18px] leading-[1.25] text-ink dark:text-chalk mt-1 mb-1">
        <Link href={`${SYLLABUS_PATH}/${id}`} className="no-underline">
          {title}
        </Link>
      </h4>
      <p className="text-[13px] text-ink-muted m-0">
        {[school, hours].filter(Boolean).join(" · ")}
      </p>
      {line ? (
        <p className="text-[14px] text-ink-soft dark:text-chalk-soft mt-2 mb-0">
          {line}
        </p>
      ) : null}
      {kind === "now" && unit ? (
        <p className="text-[13px] text-ink-soft dark:text-chalk-soft mt-2 mb-0">
          {unit}
        </p>
      ) : null}
      {kind === "now" && session ? (
        <p className="text-[13px] text-ink-strong dark:text-chalk-strong mt-2 mb-0">
          {event?.date ? `${formatDay(event.date)} · ` : "This week · "}
          {session}
        </p>
      ) : null}
      {kind === "now" && course ? (
        <p className="text-[13px] text-ink-muted mt-2 mb-0">
          {progressText(course)}
          {lastScore(id) !== "no score yet" ? ` · ${lastScore(id)}` : ""}
        </p>
      ) : null}
      {url ? (
        <p className="text-[13px] mt-2 mb-0">
          <a href={url}>source</a>
        </p>
      ) : null}
    </div>
  );
}

function TrackCard({ track }: { track: TrackDef }) {
  return (
    <article className="p-4 border border-solid border-rule dark:border-night-rule bg-paper dark:bg-night">
      <h3 className="font-normal text-[20px] leading-[1.2] text-ink dark:text-chalk mt-0 mb-2">
        {track.title}
      </h3>
      <p className="text-[14px] text-ink-soft dark:text-chalk-soft m-0">
        {track.blurb}
      </p>
      <CourseBlock id={track.nowId} kind="now" />
      <div className="mt-4 pt-3 border-t border-rule dark:border-night-rule">
        <CourseBlock id={track.nextId} kind="next" />
      </div>
    </article>
  );
}

export default function RequiredTracks() {
  return (
    <section className="not-prose mt-12">
      <h2 className="font-serif text-[1.5em] font-bold text-ink dark:text-chalk mt-0 mb-2">
        required
      </h2>
      <p className="text-[15px] text-ink-soft dark:text-chalk-soft mb-6">
        Four tracks for work, for thinking, and for the spiritual life. Each one
        has a course I am starting now, and a course waiting behind it. Writing,
        problem-solving, and thinking cut across all four; they are not separate
        classes.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {REQUIRED_TRACKS.map((track) => (
          <TrackCard key={track.id} track={track} />
        ))}
      </div>
    </section>
  );
}
