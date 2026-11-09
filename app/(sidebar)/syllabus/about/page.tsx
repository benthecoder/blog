import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/utils/pageMetadata";
import { SYLLABUS_PATH } from "@/config/syllabus";

export const metadata: Metadata = pageMetadata({
  title: "about this syllabus",
  description:
    "a self-directed open-course degree, and how I train how I think",
  path: `${SYLLABUS_PATH}/about`,
});

export default function SyllabusAboutPage() {
  return (
    <article className="prose">
      <h1>about</h1>
      <p>
        This page is the ledger of a degree I am building for myself. No
        admissions office, no tuition, no finish line: a lifelong path through
        courses anyone can open, chosen because they will still be worth knowing
        when the tools have changed. I think of it as an RL gym. I show up, put
        in the reps, read the reward signal, and slowly train how I think.
      </p>
      <p>
        I want a mind that can start from first principles. Probability before
        machine learning, algorithms before systems, the shape of a
        well-designed program before I ask a model to write one. Theology and
        close reading belong here too: a life is more than a career, and I do
        not want the inner part of mine outsourced. I pick work that should
        outlast any one model — the ideas, not the certificates.
      </p>
      <p>
        I do the work by hand, on paper. A screen makes it too easy to skim, and
        too easy to let something else think for me.
      </p>
      <p>
        Three rules keep the gym honest. I work through each sheet by hand and
        stream the session, then link the recording here. If I get stuck, I may
        ask a model questions; it should answer like a tutor, with Socratic
        questions that make me reason, not with the worked solution. I never let
        it do the problems, and the recording is there so I cannot cheat myself.
        After I finish, an LLM grades the handwriting, names the weak concepts,
        and brings them back for spaced review.
      </p>
      <p>
        How I track understanding — levels from unaware to being able to teach,
        earned only after repeated independent checks — follows{" "}
        <a href="https://github.com/janestreet/agent_skills/tree/master/socratic-tutor">
          Jane Street&apos;s socratic-tutor
        </a>
        .
      </p>
      <p>
        <Link href={SYLLABUS_PATH}>← syllabus</Link>
      </p>
    </article>
  );
}
