import type { Topic } from "@/utils/content/sayings";

const link = "text-accent hover:underline underline-offset-4 focus-ring";

/** Topics up top as one line of links, then each topic's sayings: the words,
    and under them who said it or where it is written. */
export function Sayings({ title, topics }: { title: string; topics: Topic[] }) {
  return (
    <div className="text-base leading-relaxed">
      <h1 className="text-2xl font-bold text-primary">{title}</h1>
      <nav aria-label="topics" className="mt-4">
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
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
          className="mt-12 scroll-mt-8"
        >
          <h2
            id={`${topic.id}-title`}
            className="mb-4 text-base font-bold text-primary"
          >
            {topic.title}
          </h2>
          <ul className="space-y-6">
            {topic.sayings.map((saying) => (
              <li key={saying.text}>
                <figure>
                  <blockquote className="text-primary">
                    {saying.text}
                  </blockquote>
                  <figcaption className="mt-1 text-sm text-muted">
                    {saying.cite}
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
