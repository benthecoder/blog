import { SYLLABUS_PATH } from "@/config/syllabus";
import CourseRow from "@/components/syllabus/CourseRow";
import { topicsAndInterests } from "@/lib/curriculum";

export default function TopicsList() {
  const items = topicsAndInterests();
  return (
    <ul className="m-0 list-none columns-1 gap-x-8 p-0 sm:columns-2">
      {items.map((item) => (
        <li key={item.id} className="break-inside-avoid pb-4">
          <CourseRow
            href={`${SYLLABUS_PATH}/${item.id}`}
            title={item.title}
            meta={item.citation}
          />
        </li>
      ))}
    </ul>
  );
}
