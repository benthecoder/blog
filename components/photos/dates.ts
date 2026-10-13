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
