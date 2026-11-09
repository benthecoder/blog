const pad = (n: number) => String(n).padStart(2, "0");

/** The calendar month (YYYY-MM) a YYYY-MM-DD date falls in. */
export function monthOf(date: string) {
  return date.slice(0, 7);
}

/** Where a day opens: its existing post if there is one, else a new post. */
export function dayHref(date: string, slugs: string[]) {
  const [year, month, day] = date.split("-");
  const existing = `${day}${month}${year.slice(2)}`;
  return slugs.includes(existing)
    ? `/admin/edit/${existing}`
    : `/admin/edit/new?date=${date}`;
}

/** First post in the month `offset` away from `date`, else a new post on its 1st. */
export function monthHref(date: string, offset: number, slugs: string[]) {
  const [year, month] = date.split("-").map(Number);
  const target = new Date(year, month - 1 + offset, 1);
  const mm = pad(target.getMonth() + 1);
  const yy = String(target.getFullYear()).slice(2);
  const first = slugs
    .filter((slug) => /^\d{6}$/.test(slug) && slug.slice(2) === `${mm}${yy}`)
    .sort()[0];
  return first
    ? `/admin/edit/${first}`
    : `/admin/edit/new?date=${target.getFullYear()}-${mm}-01`;
}
