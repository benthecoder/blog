import type { Metadata } from "next";
import { pageMetadata } from "@/utils/pageMetadata";
import { Section } from "@/components/layout/Section";

export const metadata: Metadata = pageMetadata({
  title: "about this syllabus",
  description:
    "a curriculum of the best free courses, shaped like a degree: my rl gym",
  path: `/syllabus/about`,
});

const body = "m-0 text-base leading-relaxed text-primary";

export default function SyllabusAboutPage() {
  return (
    <>
      <article className="prose">
        <h1>about</h1>
      </article>
      <figure className="m-0 mt-6">
        <blockquote className="m-0 text-lg italic leading-relaxed text-primary">
          &ldquo;What I cannot create, I do not understand.&rdquo;
        </blockquote>
        <figcaption className="mt-1 text-sm text-muted">
          – Richard Feynman
        </figcaption>
      </figure>

      <div className="mt-12 space-y-12">
        <Section id="why" title="why">
          <p className={body}>
            i&apos;ve always been curious. i want to keep learning, keep my
            brain growing, and become a more whole person, not just better at my
            job. so i&apos;m building my own curriculum out of the best free
            courses from harvard, mit, stanford and yale, shaped like a degree.
            there&apos;s never been a better time to do this, because ai can
            find the best material, grade my work and show me where i&apos;m
            weak. i want to think from first principles, write clearly, solve
            hard problems, and understand god and the world. i call it my rl
            gym. i do the reps, look at the reward signal, and get a little
            better each time.
          </p>
        </Section>

        <Section
          id="how"
          title="how"
          more={[{ href: "/syllabus", label: "syllabus" }]}
        >
          <p className={body}>
            i work by hand on my remarkable and stream every session. i can ask
            ai questions when i&apos;m stuck, but it never does the work for me,
            and the stream keeps me honest. every assignment has a deadline.
            late work gets marked late, and if it&apos;s still undone when the
            next class comes around, it&apos;s marked missed. an llm grades my
            handwriting, finds what i got wrong, and keeps bringing it back
            until it sticks.
          </p>
        </Section>
      </div>
    </>
  );
}
