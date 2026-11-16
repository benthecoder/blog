import type { Topic } from "@/utils/content/sayings";

const link = "text-accent hover:underline underline-offset-4 focus-ring";

/** A collection of sayings by topic: the topics up top as a short index,
    then each topic's sayings, the words over who said them and where. */
export function Sayings({ title, topics }: { title: string; topics: Topic[] }) {
  return (
    <div className="text-base leading-relaxed">
      <h1 className="text-2xl font-bold text-primary">{title}</h1>
      <nav aria-label="Topics" className="mt-6">
        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          {topics.map((topic) => (
            <li key={topic.id}>
              <a href={`#${topic.id}`} className={link}>
                {topic.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      {topics.map((topic) => (
        <section
          key={topic.id}
          id={topic.id}
          aria-labelledby={`${topic.id}-title`}
          className="mt-20 scroll-mt-8 first-of-type:mt-14"
        >
          <h2
            id={`${topic.id}-title`}
            className="text-base font-bold tracking-[0.12em] uppercase text-accent"
          >
            {topic.title}
          </h2>
          <ul className="mt-8 max-w-[65ch] space-y-10">
            {topic.sayings.map((saying) => (
              <li key={saying.text}>
                <figure>
                  <blockquote className="text-primary">
                    {saying.text}
                  </blockquote>
                  <figcaption className="mt-3 text-sm">
                    <span className="font-bold text-primary">
                      {saying.cite}
                    </span>
                    {saying.work && (
                      <span className="text-muted">, {saying.work}</span>
                    )}
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
