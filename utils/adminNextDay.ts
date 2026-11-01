/** Calendar arithmetic, rather than +24 hours, handles month/year and DST boundaries. */
export function nextPostDay(
  slug: string,
  date: unknown
): { slug: string; date: string; month: string } | null {
  const match = /^(\d{2})(\d{2})(\d{2})$/.exec(slug);
  const current = match
    ? new Date(2000 + Number(match[3]), Number(match[2]) - 1, Number(match[1]))
    : new Date(String(date ?? ""));
  if (!Number.isFinite(current.getTime())) return null;
  if (
    match &&
    (current.getDate() !== Number(match[1]) ||
      current.getMonth() + 1 !== Number(match[2]))
  )
    return null;
  current.setDate(current.getDate() + 1);
  const year = String(current.getFullYear()),
    month = String(current.getMonth() + 1).padStart(2, "0"),
    day = String(current.getDate()).padStart(2, "0");
  return {
    slug: `${day}${month}${year.slice(-2)}`,
    date: `${year}-${month}-${day}`,
    month: `${year}-${month}`,
  };
}
export function nextDayHref(
  day: ReturnType<typeof nextPostDay>,
  exists: boolean
): string {
  if (!day) return "/admin";
  return exists
    ? `/admin/edit/${day.slug}?month=${day.month}`
    : `/admin/edit/new?date=${day.date}&month=${day.month}`;
}
