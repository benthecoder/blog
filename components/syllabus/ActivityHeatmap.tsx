import { data, type ActivityDay } from "@/lib/syllabus";

// Accent mixed into the page: empty, then four levels of work.
const HEAT = [8, 30, 55, 80, 100].map(
  (pct) =>
    `color-mix(in oklab, var(--color-accent) ${pct}%, var(--color-surface))`
);
const DOW = ["S", "M", "T", "W", "T", "F", "S"];

function emptyDays(weeks = 16): ActivityDay[] {
  const today = new Date(`${data.as_of || "2026-11-08"}T12:00:00`);
  const start = new Date(today);
  start.setDate(start.getDate() - (weeks * 7 - 1));
  start.setDate(start.getDate() - ((start.getDay() + 7) % 7));
  const days: ActivityDay[] = [];
  for (
    const cursor = new Date(start);
    cursor <= today;
    cursor.setDate(cursor.getDate() + 1)
  ) {
    const iso = cursor.toISOString().slice(0, 10);
    days.push({ date: iso, level: 0 });
  }
  return days;
}

export default function ActivityHeatmap() {
  const days = data.activity?.length ? data.activity : emptyDays();
  const weeks: ActivityDay[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  const cell = 10;
  const gap = 3;
  const label = 16;
  const width = label + weeks.length * (cell + gap);
  const height = 7 * (cell + gap) - gap;

  return (
    <div className="overflow-x-auto">
      <svg
        role="img"
        aria-label="Activity over the last several weeks. No work nights yet."
        width={width}
        height={height}
        className="block"
      >
        {DOW.map((name, row) => (
          <text
            key={name + row}
            x={0}
            y={row * (cell + gap) + cell - 1}
            fontSize="11"
            fill="currentColor"
            className="fill-muted"
          >
            {row % 2 === 0 ? name : ""}
          </text>
        ))}
        {weeks.map((week, col) =>
          week.map((day, row) => {
            const level = Math.max(0, Math.min(4, day.level || 0));
            return (
              <rect
                key={day.date}
                x={label + col * (cell + gap)}
                y={row * (cell + gap)}
                width={cell}
                height={cell}
                rx={2}
                style={{ fill: HEAT[level] }}
              >
                <title>{day.date}</title>
              </rect>
            );
          })
        )}
      </svg>
    </div>
  );
}
