import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/utils/pageMetadata";
import { SYLLABUS_PATH } from "@/config/syllabus";
import learn from "@/data/learn.json";

export const metadata: Metadata = pageMetadata({
  title: "syllabus",
  description: "the open-course school I am building for myself",
  path: SYLLABUS_PATH,
});

type Lesson = {
  course_id: string;
  title: string;
  short_title?: string | null;
  source_url?: string | null;
  problems: { ref: string; status: string; feedback?: string | null }[];
};

type CurriculumItem = {
  id: string;
  title: string;
  short_title?: string | null;
  institution?: string;
  area?: string;
  lane?: string;
  url?: string;
  percent_certified?: number | null;
};

type ReviewItem = {
  id: string;
  title?: string;
  course_id?: string;
  due_on?: string | null;
  status?: string;
};

const data = learn as {
  streaks?: { daily: number; weekly: number; work_nights: number };
  streams?: { date: string; url: string; title?: string | null }[];
  schedule?: { day: string; title?: string; detail?: string | null; course_id?: string | null; stream?: boolean }[];
  current_week?: { week: string; issued_on?: string; lessons: Lesson[] };
  curriculum?: CurriculumItem[];
  review?: { due: ReviewItem[]; weak: ReviewItem[] };
};

function plain(s: string) {
  return s.replaceAll("\u2014", " - ").replaceAll("\u2013", "-");
}

type PlanItem = {
  title: string;
  href: string;
  done?: boolean;
  note?: string;
  reflectionHref?: string;
};

type Subject = {
  name: string;
  assessment: string;
  items: PlanItem[];
};

const november: Subject[] = [
  {
    name: "Probability",
    assessment: "Not yet graded. Certification will come from an agent reading the official Stat 110 solutions, not from opening the PDF.",
    items: [
      {
        title: "Harvard Stat 110, Homework 1, problems 1 and 2 (Blitzstein)",
        href: "https://stat110.hsites.harvard.edu/strategic-practice-problems",
        note: "On the tablet this week as Stat 110 · 2026-W46.",
      },
    ],
  },
  {
    name: "Calculus",
    assessment: "Not yet graded.",
    items: [
      {
        title: "MIT 18.01SC Session 2, The Derivative of |x| (Jerison)",
        href: "https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/resources/mit18_01scf10_ex02prb/",
        note: "On the tablet this week as 18.01SC · 2026-W46.",
      },
    ],
  },
  {
    name: "Physics",
    assessment: "Not yet graded.",
    items: [
      {
        title: "MIT 8.01SC Problem Set 1, Problem 2: Elevator Trip",
        href: "https://ocw.mit.edu/courses/8-01sc-classical-mechanics-fall-2016/pages/week-1-kinematics/problem-set-1/",
        note: "On the tablet this week as 8.01SC · 2026-W46.",
      },
    ],
  },
  {
    name: "Hebrew Bible",
    assessment: "Notes, not a problem set. No official solution to mark correct or false.",
    items: [
      {
        title: "Yale RLST 145, Lecture 1: The Parts of the Whole (Christine Hayes)",
        href: "https://oyc.yale.edu/religious-studies/rlst-145/lecture-1",
        note: "Assigned reading on that page: Jewish Study Bible, Introduction to Genesis, pp. 8-11; Genesis 1-4.",
      },
    ],
  },
  {
    name: "Algorithms",
    assessment: "Not yet graded.",
    items: [
      {
        title: "MIT 6.006 Problem Set 1, Problem 1-1(a)",
        href: "https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/pages/assignments/",
        note: "On the tablet this week as 6.006 · 2026-W46.",
      },
    ],
  },
  {
    name: "Letters",
    assessment: "A reading list I keep, not a course percent.",
    items: [
      {
        title: "Augustine, Lewis, and the ESV, ongoing",
        href: "https://www.esv.org/",
      },
    ],
  },
];

const december: Subject[] = [
  {
    name: "Probability and calculus, continued",
    assessment: "Planned. The weekly sheet will keep cutting real problem sets from Stat 110 and 18.01SC.",
    items: [
      { title: "Harvard Stat 110", href: "https://stat110.hsites.harvard.edu/" },
      { title: "MIT 18.01SC Single Variable Calculus", href: "https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/" },
    ],
  },
  {
    name: "Biology",
    assessment: "Planned. Rotates in as the science for a later week.",
    items: [
      { title: "MIT 7.01SC Fundamentals of Biology", href: "https://ocw.mit.edu/courses/7-01sc-fundamentals-of-biology-fall-2011/" },
    ],
  },
  {
    name: "Philosophy",
    assessment: "Planned. Essays and notes against a published rubric, when I get there.",
    items: [
      { title: "Yale PHIL 176 Death (Shelly Kagan)", href: "https://oyc.yale.edu/philosophy/phil-176" },
    ],
  },
  {
    name: "Software",
    assessment: "Planned. Evidence for CS146S is a merged pull request, not ink.",
    items: [
      { title: "Stanford CS146S The Modern Software Developer", href: "https://themodernsoftware.dev/" },
    ],
  },
];

const january: Subject[] = [
  {
    name: "Still in rotation",
    assessment: "Planned. I will keep the same daily rhythm and let the mix wander so I do not stall on one subject.",
    items: [
      { title: "MIT 5.111SC Principles of Chemical Science", href: "https://ocw.mit.edu/courses/5-111sc-principles-of-chemical-science-fall-2014/" },
      { title: "Yale ENGL 220 Milton", href: "https://oyc.yale.edu/english/engl-220" },
      { title: "Yale HIST 119 The Civil War and Reconstruction Era (David Blight)", href: "https://oyc.yale.edu/history/hist-119" },
      { title: "Yale ECON 159 Game Theory (Ben Polak)", href: "https://oyc.yale.edu/economics/econ-159" },
    ],
  },
  {
    name: "Waiting until the foundations are further along",
    assessment: "Not started. These stay on the list so I can see where the year is pointed.",
    items: [
      { title: "MIT 18.02SC Multivariable Calculus", href: "https://ocw.mit.edu/courses/18-02sc-multivariable-calculus-fall-2010/" },
      { title: "MIT 18.06 Linear Algebra (Strang)", href: "https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/" },
      { title: "Stanford CS229 Machine Learning", href: "https://cs229.stanford.edu/" },
    ],
  },
];

function SubjectBlock({ subject }: { subject: Subject }) {
  return (
    <section className="mt-8">
      <h3 className="font-serif text-lg text-ink-strong">{subject.name}</h3>
      <ul className="mt-2 space-y-2">
        {subject.items.map((item) => (
          <li key={item.href + item.title}>
            {item.done ? <span className="mr-2">✅</span> : null}
            <a href={item.href} className="underline decoration-rule underline-offset-2 hover:text-ink">
              {plain(item.title || "")}
            </a>
            {item.note ? (
              <span className="block text-sm text-ink-muted mt-0.5">{item.note}</span>
            ) : null}
            {item.reflectionHref ? (
              <span className="block text-sm mt-0.5">
                <Link href={item.reflectionHref}>reflection</Link>
              </span>
            ) : null}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm italic text-ink-muted">
        Assessment: {subject.assessment}
      </p>
    </section>
  );
}

export default function SyllabusPage() {
  const week = data.current_week;
  const streaks = data.streaks;
  const review = data.review || { due: [], weak: [] };
  const streams = data.streams || [];
  const schedule = data.schedule || [];
  const workNights = streaks?.work_nights ?? 0;

  return (
    <article className="prose">
      <p className="text-sm text-ink-muted not-prose mb-6">
        a living syllabus · {week?.week ?? ""}
      </p>
      <h1>syllabus</h1>

      <h2>Introduction</h2>
      <p className="italic text-ink-muted">
        This introduction is a draft. I will rewrite it in my own words.
      </p>
      <p>
        I went to Iowa and USF and left without the education I wanted. This
        page is the school I am building for myself. The courses a stronger
        university would have put in front of me, plus the books and lectures I
        actually want to sit with.
      </p>
      <p>
        I want to be someone who could walk into an AI lab and belong there.
        That means real mathematics, probability, algorithms, and the habit of
        working a problem until it yields. It also means not shrinking the rest
        of a life: physics, chemistry, biology, history, economics, philosophy,
        literature, and scripture.
      </p>
      <p>
        I am cutting out faux learning. Short posts, streaky quiz apps, and a
        timeline of other people&apos;s thoughts are not a substitute for sitting
        down with a hard page and a pen. I do the thinking on the reMarkable.
        Agents collect the sheets, grade them against official solutions, and
        keep this record honest.
      </p>

      <h2>Description</h2>
      <p>
        By the end of this first stretch I want to be able to say, without
        bluffing:
      </p>
      <ul>
        <li>
          I can work an undergraduate probability problem from Stat 110 and
          explain the story, not just the number.
        </li>
        <li>
          I can differentiate carefully, including the places a function
          misbehaves.
        </li>
        <li>
          I have started mechanics, algorithms, and the Hebrew Bible the same
          way I start everything here: by hand, from the real materials.
        </li>
        <li>
          I can point to work I streamed, and to grades that are not my own
          cheerleading.
        </li>
      </ul>
      <p>
        The guiding questions are simple. What would a better undergraduate
        education have asked me to know? What does an AI lab actually need me
        to be fluent in? What kind of person do I want to be while I learn
        that?
      </p>

      <h2>Methodology</h2>
      <p>
        Most days I take a class of about thirty to forty-five minutes and
        rotate the subject so I do not live inside one topic until I go stale.
        The week&apos;s mix is usually probability and calculus, plus one science,
        one humanities or theology reading, and one engineering or computer
        science item. Loads stay light on purpose.
      </p>
      <p>
        I write on the reMarkable. Any agent can grade against the official
        solutions and send a feedback page back next to the work. I stream the
        night sessions on YouTube, with the tablet and a model side by side,
        often with music on. After a grade, the concepts I missed come back as
        spaced review, not as a one-and-done check. A few recall questions can
        land on the day&apos;s sheet so I touch the weak spots before I start
        something new.
      </p>

      <h2>This week</h2>
      <p>
        {workNights === 0
          ? "No work nights recorded yet. Issued sheets do not count."
          : workNights === 1
            ? "One work night recorded."
            : `${workNights} work nights recorded.`}
        {streaks?.daily
          ? ` Nightly streak: ${streaks.daily}.`
          : ""}
      </p>

      {schedule.length > 0 ? (
        <div className="not-prose my-6 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-rule text-ink-muted">
                <th className="py-2 pr-4 font-normal">Day</th>
                <th className="py-2 font-normal">Class</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((row) => (
                <tr key={row.day} className="border-b border-rule/70">
                  <td className="py-2 pr-4 align-top whitespace-nowrap">{row.day}</td>
                  <td className="py-2 align-top">
                    {row.title}
                    {row.detail ? (
                      <span className="block text-ink-muted">{row.detail}</span>
                    ) : null}
                    {row.stream ? (
                      <span className="block text-ink-muted">stream night</span>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <p>On the tablet right now:</p>
      <ul>
        {(week?.lessons || []).map((lesson) => (
          <li key={lesson.course_id}>
            {lesson.source_url ? (
              <a href={lesson.source_url}>{plain(lesson.short_title || lesson.title)}</a>
            ) : (
              plain(lesson.short_title || lesson.title)
            )}
            {lesson.problems?.length ? (
              <span className="text-ink-muted">
                {": "}{lesson.problems.map((p) => plain(p.ref)).join("; ")}
              </span>
            ) : null}
          </li>
        ))}
      </ul>

      <h3>Review this week</h3>
      {review.due.length === 0 && review.weak.length === 0 ? (
        <p>
          Nothing is due yet. Review starts after the first graded set, when
          missed concepts come back on a schedule.
        </p>
      ) : (
        <ul>
          {review.due.map((item) => (
            <li key={`due-${item.id}`}>
              {plain(item.title || "")}
              {item.due_on ? ` · due ${item.due_on}` : ""}
            </li>
          ))}
          {review.weak.map((item) => (
            <li key={`weak-${item.id}`}>{plain(item.title || "")} · weak</li>
          ))}
        </ul>
      )}

      <h3>Recordings</h3>
      {streams.length === 0 ? (
        <p>No streams linked yet. Night sessions will appear here as YouTube links.</p>
      ) : (
        <ul>
          {streams.map((s) => (
            <li key={s.url}>
              <a href={s.url}>{s.title || s.date}</a>
            </li>
          ))}
        </ul>
      )}

      <h2>November</h2>
      <p>
        The term begins the week of 9 November 2026. These are the real first
        cuts, not a sample of imagined progress.
      </p>
      {november.map((subject) => (
        <SubjectBlock key={subject.name} subject={subject} />
      ))}

      <h2>December</h2>
      <p>
        A plan, not a record. Nothing below is checked off because none of it
        has been certified yet.
      </p>
      {december.map((subject) => (
        <SubjectBlock key={subject.name} subject={subject} />
      ))}

      <h2>January</h2>
      {january.map((subject) => (
        <SubjectBlock key={subject.name} subject={subject} />
      ))}

      <h2>The rest of the shelf</h2>
      <p>
        Courses I have enrolled in or queued, so the year stays wide. Percents
        stay blank until certified work exists.
      </p>
      <ul>
        {(data.curriculum || []).map((c) => (
          <li key={c.id}>
            {c.url ? <a href={c.url}>{plain(c.title)}</a> : plain(c.title)}
            {c.institution ? (
              <span className="text-ink-muted"> · {c.institution}</span>
            ) : null}
          </li>
        ))}
      </ul>

      <h2>Daily habits I hold myself to</h2>
      <ul>
        <li>Sit for the day&apos;s class, thirty to forty-five minutes, on the tablet.</li>
        <li>Write by hand. Do not swap the work for a quiz app or a scroll.</li>
        <li>When I sit at night, stream it.</li>
        <li>Before new problems, answer whatever review is due.</li>
        <li>Let an agent grade the page. Do not mark myself certified.</li>
      </ul>
    </article>
  );
}
