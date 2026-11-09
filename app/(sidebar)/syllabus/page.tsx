import type { Metadata } from "next";
import { pageMetadata } from "@/utils/pageMetadata";
import { SYLLABUS_PATH } from "@/config/syllabus";
import learn from "@/data/learn.json";

export const metadata: Metadata = pageMetadata({
  title: "syllabus",
  description: "a running list of what I'm learning",
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
  schedule?: {
    day: string;
    title?: string;
    detail?: string | null;
    course_id?: string | null;
    stream?: boolean;
  }[];
  current_week?: { week: string; issued_on?: string; lessons: Lesson[] };
  curriculum?: CurriculumItem[];
  review?: { due: ReviewItem[]; weak: ReviewItem[] };
};

function plain(s: string) {
  return s.replaceAll("\u2014", " - ").replaceAll("\u2013", "-");
}

function isDone(courseId?: string) {
  if (!courseId) return false;
  const course = (data.curriculum || []).find((c) => c.id === courseId);
  return (course?.percent_certified ?? 0) >= 100;
}

type ListItem = {
  title: string;
  href: string;
  courseId?: string;
};

type Topic = {
  name: string;
  items: ListItem[];
};

type Area = {
  name: string;
  topics: Topic[];
};

const areas: Area[] = [
  {
    name: "math",
    topics: [
      {
        name: "probability",
        items: [
          {
            title: "Harvard Stat 110",
            href: "https://stat110.hsites.harvard.edu/",
            courseId: "stat110",
          },
        ],
      },
      {
        name: "calculus",
        items: [
          {
            title: "MIT 18.01SC Single Variable Calculus",
            href: "https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/",
            courseId: "mit-1801sc",
          },
          {
            title: "MIT 18.02SC Multivariable Calculus",
            href: "https://ocw.mit.edu/courses/18-02sc-multivariable-calculus-fall-2010/",
            courseId: "mit-1802sc",
          },
        ],
      },
      {
        name: "linear algebra",
        items: [
          {
            title: "MIT 18.06 Linear Algebra (Strang)",
            href: "https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/",
            courseId: "mit-1806",
          },
        ],
      },
    ],
  },
  {
    name: "science",
    topics: [
      {
        name: "physics",
        items: [
          {
            title: "MIT 8.01SC Classical Mechanics",
            href: "https://ocw.mit.edu/courses/8-01sc-classical-mechanics-fall-2016/",
            courseId: "mit-801sc",
          },
          {
            title: "MIT 8.02SC Electricity and Magnetism",
            href: "https://ocw.mit.edu/courses/8-02sc-physics-ii-electricity-and-magnetism-fall-2010/",
            courseId: "mit-802sc",
          },
        ],
      },
      {
        name: "chemistry",
        items: [
          {
            title: "MIT 5.111SC Principles of Chemical Science",
            href: "https://ocw.mit.edu/courses/5-111sc-principles-of-chemical-science-fall-2014/",
            courseId: "mit-5111sc",
          },
        ],
      },
      {
        name: "biology",
        items: [
          {
            title: "MIT 7.01SC Fundamentals of Biology",
            href: "https://ocw.mit.edu/courses/7-01sc-fundamentals-of-biology-fall-2011/",
            courseId: "mit-701sc",
          },
        ],
      },
    ],
  },
  {
    name: "engineering",
    topics: [
      {
        name: "circuits",
        items: [
          {
            title: "MIT 6.002 Circuits and Electronics",
            href: "https://ocw.mit.edu/courses/6-002-circuits-and-electronics-spring-2007/",
            courseId: "mit-6002",
          },
        ],
      },
      {
        name: "computation structures",
        items: [
          {
            title: "MIT 6.004 Computation Structures",
            href: "https://ocw.mit.edu/courses/6-004-computation-structures-spring-2017/",
            courseId: "mit-6004",
          },
        ],
      },
    ],
  },
  {
    name: "computer science",
    topics: [
      {
        name: "algorithms",
        items: [
          {
            title: "MIT 6.006 Introduction to Algorithms",
            href: "https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/",
            courseId: "mit-6006",
          },
        ],
      },
      {
        name: "software",
        items: [
          {
            title: "Stanford CS146S The Modern Software Developer",
            href: "https://themodernsoftware.dev/",
            courseId: "stanford-cs146s",
          },
        ],
      },
    ],
  },
  {
    name: "AI",
    topics: [
      {
        name: "machine learning",
        items: [
          {
            title: "Stanford CS229 Machine Learning",
            href: "https://cs229.stanford.edu/",
            courseId: "stanford-cs229",
          },
          {
            title: "Stanford CS 312 Deep Learning Alchemy",
            href: "https://deep-learning-alchemy.github.io/",
            courseId: "stanford-cs312",
          },
        ],
      },
      {
        name: "LLMs",
        items: [
          {
            title: "Stanford CS224N NLP with Deep Learning",
            href: "https://web.stanford.edu/class/cs224n/",
            courseId: "stanford-cs224n",
          },
        ],
      },
      {
        name: "computer vision",
        items: [
          {
            title: "Stanford CS231n Deep Learning for Computer Vision",
            href: "https://cs231n.stanford.edu/",
            courseId: "stanford-cs231n",
          },
        ],
      },
      {
        name: "AI safety / security",
        items: [],
      },
    ],
  },
  {
    name: "philosophy",
    topics: [
      {
        name: "death",
        items: [
          {
            title: "Yale PHIL 176 Death (Shelly Kagan)",
            href: "https://oyc.yale.edu/philosophy/phil-176",
            courseId: "yale-phil176",
          },
        ],
      },
      {
        name: "justice",
        items: [
          {
            title: "Harvard Justice",
            href: "https://www.edx.org/learn/justice/harvard-university-justice",
            courseId: "harvard-justice",
          },
        ],
      },
    ],
  },
  {
    name: "literature",
    topics: [
      {
        name: "milton",
        items: [
          {
            title: "Yale ENGL 220 Milton",
            href: "https://oyc.yale.edu/english/engl-220",
            courseId: "yale-engl220",
          },
        ],
      },
      {
        name: "theory",
        items: [
          {
            title: "Yale ENGL 300 Introduction to Theory of Literature",
            href: "https://oyc.yale.edu/english/engl-300",
            courseId: "yale-engl300",
          },
        ],
      },
    ],
  },
  {
    name: "theology",
    topics: [
      {
        name: "hebrew bible",
        items: [
          {
            title:
              "Yale RLST 145 Introduction to the Old Testament (Hebrew Bible)",
            href: "https://oyc.yale.edu/religious-studies/rlst-145",
            courseId: "yale-rlst145",
          },
        ],
      },
      {
        name: "new testament",
        items: [
          {
            title:
              "Yale RLST 152 Introduction to the New Testament History and Literature",
            href: "https://oyc.yale.edu/religious-studies/rlst-152",
            courseId: "yale-rlst152",
          },
        ],
      },
      {
        name: "letters",
        items: [
          {
            title: "Augustine, Lewis, and the ESV",
            href: "https://www.esv.org/",
            courseId: "letters",
          },
        ],
      },
    ],
  },
  {
    name: "history",
    topics: [
      {
        name: "american civil war",
        items: [
          {
            title:
              "Yale HIST 119 The Civil War and Reconstruction Era, 1845-1877",
            href: "https://oyc.yale.edu/history/hist-119",
            courseId: "yale-hist119",
          },
        ],
      },
    ],
  },
  {
    name: "economics",
    topics: [
      {
        name: "game theory",
        items: [
          {
            title: "Yale ECON 159 Game Theory (Ben Polak)",
            href: "https://oyc.yale.edu/economics/econ-159",
            courseId: "yale-econ159",
          },
        ],
      },
      {
        name: "microeconomics",
        items: [
          {
            title: "MIT 14.01 Principles of Microeconomics",
            href: "https://ocw.mit.edu/courses/14-01-principles-of-microeconomics-fall-2018/",
            courseId: "mit-1401",
          },
        ],
      },
    ],
  },
  {
    name: "languages",
    topics: [
      {
        name: "mandarin",
        items: [],
      },
    ],
  },
];

function CourseLink({ item }: { item: ListItem }) {
  const done = isDone(item.courseId);
  return (
    <li>
      {done ? <span className="mr-2">✅</span> : null}
      <a href={item.href}>{plain(item.title)}</a>
    </li>
  );
}

export default function SyllabusPage() {
  const streaks = data.streaks;
  const review = data.review || { due: [], weak: [] };
  const streams = data.streams || [];
  const schedule = data.schedule || [];
  const workNights = streaks?.work_nights ?? 0;

  const streakLine =
    workNights === 0
      ? "no work nights recorded yet."
      : workNights === 1
        ? "one work night recorded."
        : `${workNights} work nights recorded.`;
  const streakExtra = streaks?.daily
    ? ` nightly streak: ${streaks.daily}.`
    : "";

  return (
    <article className="prose">
      <h1>syllabus</h1>
      <p className="text-sm text-accent/60 not-prose -mt-4 mb-6">
        Last updated: Nov 8, 2026
      </p>

      <p>
        I want to spend less time on brainrot and more time becoming someone,
        not just getting good at one thing for work, but developing myself
        holistically. Math, science, literature, philosophy, faith, a language.
        I like to think of it as time-traveling back to the Renaissance, or
        whatever golden age that was, when learning and working on yourself was
        the pinnacle. This is a running list of what I&apos;ve thought of so
        far. I&apos;ll keep updating it.
      </p>

      <h2>this week</h2>
      <p>
        {streakLine}
        {streakExtra}
      </p>
      {schedule.length > 0 ? (
        <div className="not-prose my-4 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-rule text-ink-muted">
                <th className="py-1.5 pr-4 font-normal">day</th>
                <th className="py-1.5 font-normal">class</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((row) => (
                <tr key={row.day} className="border-b border-rule/70">
                  <td className="py-1.5 pr-4 align-top whitespace-nowrap">
                    {row.day.toLowerCase()}
                  </td>
                  <td className="py-1.5 align-top">
                    {row.title}
                    {row.detail ? (
                      <span className="block text-ink-muted">{row.detail}</span>
                    ) : null}
                    {row.stream ? (
                      <span className="block text-ink-muted">stream</span>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {review.due.length === 0 && review.weak.length === 0 ? (
        <p>review: nothing due yet.</p>
      ) : (
        <ul>
          {review.due.map((item) => (
            <li key={`due-${item.id}`}>
              review: {plain(item.title || "")}
              {item.due_on ? ` · due ${item.due_on}` : ""}
            </li>
          ))}
          {review.weak.map((item) => (
            <li key={`weak-${item.id}`}>weak: {plain(item.title || "")}</li>
          ))}
        </ul>
      )}
      {streams.length === 0 ? (
        <p>recordings: none yet.</p>
      ) : (
        <ul>
          {streams.map((s) => (
            <li key={s.url}>
              <a href={s.url}>{s.title || s.date}</a>
            </li>
          ))}
        </ul>
      )}

      <h2>rules</h2>
      <ul>
        <li>I stream myself working and link the recordings here.</li>
        <li>
          AI is only for questions, never to solve the problem for me. The
          stream is how I catch myself if I start cheating.
        </li>
        <li>
          An LLM grades my handwritten work, finds the concepts I&apos;m weak
          on, and brings them back as spaced review.
        </li>
      </ul>

      {areas.map((area) => (
        <section key={area.name}>
          <h2>{area.name}</h2>
          {area.topics.map((topic) => (
            <section key={topic.name}>
              <h3>{topic.name}</h3>
              {topic.items.length > 0 ? (
                <ul>
                  {topic.items.map((item) => (
                    <CourseLink key={item.href + item.title} item={item} />
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </section>
      ))}
    </article>
  );
}
