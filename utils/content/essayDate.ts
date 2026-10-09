// "2026-03-01" -> "March 1, 2026". Parsed as UTC so the day never shifts.
export function formatEssayDate(date: string): string {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

// Frontmatter dates may parse as Date objects; keep them as YYYY-MM-DD.
export function toDateString(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return typeof value === "string" ? value : "";
}
