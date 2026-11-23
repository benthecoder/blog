import type { Metadata } from "next";
import {
  formatWeekRange,
  missedWeekCount,
  weeksNewestFirst,
  type AlchemySession,
  type SessionStatus,
  type Stat110Session,
} from "@/data/learning";
import { pageMetadata } from "@/utils/pageMetadata";

export const metadata: Metadata = pageMetadata({
  title: "learning",
  description:
    "A weekly record of Stat 110 and Stanford CS 312 Deep Learning Alchemy.",
  path: "/learning",
});

export const dynamic = "force-static";

const ALCHEMY_URL = "https://deep-learning-alchemy.github.io/";

function statusClass(status: SessionStatus): string | undefined {
  if (status === "missed") return "text-danger";
  if (status === "upcoming") return "text-muted";
  return undefined;
}

function statLine(session: Stat110Session): string {
  return [session.lecture, session.score].filter(Boolean).join(" · ");
}

function alchemyLine(session: AlchemySession): string {
  const quiz =
    session.prediction || session.result
      ? [
          session.prediction ? `predicted ${session.prediction}` : null,
          session.result ? `actual ${session.result}` : null,
        ]
          .filter(Boolean)
          .join(", ")
      : "";
  return [session.unit, quiz].filter(Boolean).join(" · ");
}

export default function LearningPage() {
  const rows = weeksNewestFirst();
  const missed = missedWeekCount();
  const missedLabel =
    missed === 1 ? "1 missed week." : `${missed} missed weeks.`;

  return (
    <>
      <article className="prose">
        <h1>learning</h1>
        <p>
          a weekly record of whether I showed up for Stat 110 on Saturdays and{" "}
          <a href={ALCHEMY_URL}>Deep Learning Alchemy</a> on Sundays.
        </p>
        <p className={missed > 0 ? "text-danger" : undefined}>{missedLabel}</p>
      </article>

      <div className="mt-12 space-y-12">
        {rows.map((week) => (
          <section key={week.start} aria-labelledby={`week-${week.start}`}>
            <h2
              id={`week-${week.start}`}
              className="m-0 text-xl font-bold text-primary"
            >
              {formatWeekRange(week.start, week.end)}
            </h2>
            <dl className="mt-4 space-y-4">
              <div>
                <dt className="m-0 text-sm text-primary">
                  Stat 110{" "}
                  <span className={statusClass(week.stat110.status)}>
                    · {week.stat110.status}
                  </span>
                </dt>
                <dd className="m-0 mt-0.5 text-sm text-muted">
                  {statLine(week.stat110)}
                </dd>
              </div>
              <div>
                <dt className="m-0 text-sm text-primary">
                  Alchemy{" "}
                  <span className={statusClass(week.alchemy.status)}>
                    · {week.alchemy.status}
                  </span>
                </dt>
                <dd className="m-0 mt-0.5 text-sm text-muted">
                  {alchemyLine(week.alchemy)}
                </dd>
              </div>
            </dl>
          </section>
        ))}
      </div>
    </>
  );
}
