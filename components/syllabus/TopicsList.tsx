import Link from "next/link";
import { SYLLABUS_PATH } from "@/config/syllabus";
import { topicsAndInterests } from "@/lib/curriculum";

export default function TopicsList({
  heading = "topics and interests",
}: {
  heading?: string | null;
}) {
  const items = topicsAndInterests();
  return (
    <section className="not-prose mt-6">
      {heading ? (
        <h2 className="font-serif text-[1.5em] font-bold text-ink dark:text-chalk mt-0 mb-4">
          {heading}
        </h2>
      ) : null}
      <ul className="list-none p-0 m-0 columns-1 sm:columns-2 gap-x-8">
        {items.map((item) => (
          <li key={item.id} className="break-inside-avoid py-1.5">
            <Link
              href={`${SYLLABUS_PATH}/${item.id}`}
              className="text-[14px] text-ink-strong dark:text-chalk-strong no-underline hover:underline"
            >
              {item.title}
            </Link>
            {item.school ? (
              <span className="text-[12px] text-ink-muted">
                {" "}
                · {item.school}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
