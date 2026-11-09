import Link from "next/link";
import { SYLLABUS_PATH } from "@/config/syllabus";
import {
  catalogAreas,
  displayTitle,
  hoursLabel,
  oneLiner,
  optionalSubscribed,
  plain,
  schoolOf,
  shelfItems,
} from "@/lib/curriculum";

export default function OptionalShelf() {
  const subscribed = optionalSubscribed();
  const shelf = shelfItems();
  const grouped = catalogAreas
    .map((area) => ({
      ...area,
      items: shelf.filter((item) => item.area === area.id),
    }))
    .filter((area) => area.items.length > 0);

  return (
    <section className="not-prose mt-12">
      <h2 className="font-serif text-[1.5em] font-bold text-ink dark:text-chalk mt-0 mb-2">
        optional brain food
      </h2>
      <p className="text-[15px] text-ink-soft dark:text-chalk-soft mb-5">
        Physics, chemistry, literature, music, and the rest of the shelf. Good
        for the mind, not required for the next stretch of work or spiritual
        life.
      </p>

      {subscribed.length > 0 ? (
        <ul className="list-none p-0 m-0 mb-6">
          {subscribed.map((course) => (
            <li
              key={course.id}
              className="py-2.5 border-b border-rule dark:border-night-rule"
            >
              <p className="m-0 text-[15px]">
                <Link href={`${SYLLABUS_PATH}/${course.id}`}>
                  {displayTitle(course)}
                </Link>
                <span className="text-ink-muted">
                  {" "}
                  · {plain(course.institution || schoolOf(course.id))}
                </span>
              </p>
              {oneLiner(course.id) ? (
                <p className="m-0 mt-1 text-[13px] text-ink-soft dark:text-chalk-soft">
                  {oneLiner(course.id)}
                </p>
              ) : course.title ? (
                <p className="m-0 mt-1 text-[13px] text-ink-soft dark:text-chalk-soft">
                  {plain(course.title)}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      <details className="border border-rule dark:border-night-rule p-4">
        <summary className="cursor-pointer text-[15px] text-ink-strong dark:text-chalk-strong">
          The wider shelf ({shelf.length} more picks)
        </summary>
        <div className="mt-4">
          {grouped.map((area) => (
            <section key={area.id} className="mb-5">
              <h3 className="font-mono text-2xs tracking-[0.14em] uppercase text-ink-muted mt-0 mb-1">
                {area.title}
              </h3>
              {area.why_this_outlasts_ai ? (
                <p className="text-[13px] text-ink-soft dark:text-chalk-soft mt-0 mb-2">
                  {plain(area.why_this_outlasts_ai)}
                </p>
              ) : null}
              <ul className="list-none p-0 m-0">
                {area.items.map((item) => (
                  <li key={item.id} className="py-1.5 text-[14px]">
                    <Link href={`${SYLLABUS_PATH}/${item.id}`}>
                      {item.title}
                    </Link>
                    <span className="text-ink-muted">
                      {item.institution || item.instructor
                        ? ` · ${plain(item.institution || item.instructor || "")}`
                        : ""}
                      {hoursLabel(item.id) ? ` · ${hoursLabel(item.id)}` : ""}
                    </span>
                    {item.recommended_by && item.recommended_by.length > 0 ? (
                      <span className="text-ink-muted">
                        {` · recommended by ${item.recommended_by
                          .map((row) => row.name)
                          .join(", ")}`}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </details>
    </section>
  );
}
