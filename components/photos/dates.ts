export function formatMonth(date?: string, style: "short" | "long" = "long") {
  if (!date) return "Undated";
  const parsed = new Date(date.length === 10 ? `${date}T12:00:00Z` : date);
  if (Number.isNaN(parsed.getTime())) return "Undated";
  return new Intl.DateTimeFormat("en", {
    month: style,
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}

export function formatDay(date?: string) {
  if (!date) return "Undated";
  const parsed = new Date(`${date.slice(0, 10)}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return "Undated";
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}

// "Jun 2025 — Jul 2025", or one month when they match.
export function monthRange(photos: { date?: string }[]) {
  const dates = photos.flatMap((photo) => (photo.date ? [photo.date] : []));
  if (dates.length === 0) return undefined;
  dates.sort();
  const first = formatMonth(dates[0], "short");
  const last = formatMonth(dates.at(-1), "short");
  return first === last ? first : `${first} — ${last}`;
}
