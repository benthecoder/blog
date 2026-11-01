const MONTH_MAP: { [key: string]: number } = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

function parseMonthName(dateStr: string): Date | null {
  const match = dateStr.match(/([A-Za-z]+)\s+(\d{1,2})(?:,?\s+)?(\d{4})/);
  if (!match) return null;
  const [, month, day, year] = match;
  const monthIndex = MONTH_MAP[month.toLowerCase()];
  if (monthIndex === undefined) return null;
  const date = new Date(parseInt(year), monthIndex, parseInt(day));
  return isNaN(date.getTime()) ? null : date;
}

export function extractPostDate(
  filePath: string,
  frontmatter: { date?: string } | null
): Date {
  const date = frontmatter?.date;
  if (date) {
    // Date-only ISO strings parse as UTC midnight; keep them local like the
    // other formats so toISODateString round-trips in any timezone.
    const iso = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (iso) {
      const local = new Date(+iso[1], +iso[2] - 1, +iso[3]);
      if (!isNaN(local.getTime())) return local;
    }

    const direct = new Date(date);
    if (!isNaN(direct.getTime())) return direct;

    const fromName = parseMonthName(date);
    if (fromName) return fromName;

    console.warn(
      `Could not parse date '${date}' from frontmatter in ${filePath}`
    );
  }

  const filenameMatch = filePath.match(/(\d{2})(\d{2})(\d{2})\.md$/);
  if (filenameMatch) {
    const [, month, day, year] = filenameMatch;
    return new Date(parseInt(`20${year}`), parseInt(month) - 1, parseInt(day));
  }

  console.warn(`No date found for ${filePath}, using default`);
  return new Date(2020, 0, 1);
}

export function toISODateString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * Frontmatter dates carry no timezone. `new Date("2023-05-27")` is UTC
 * midnight, which renders as May 26 west of UTC, so read the ISO form as
 * local midnight like the "May 27, 2023" form already is.
 */
export function parsePostDate(date: string): Date {
  const iso = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return iso ? new Date(+iso[1], +iso[2] - 1, +iso[3]) : new Date(date);
}

// Frontmatter dates carry no timezone, so read them with local getters.
// Returns undefined when unparseable.
export function postDateISO(date: string): string | undefined {
  const iso = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    const local = new Date(+iso[1], +iso[2] - 1, +iso[3]);
    return toISODateString(local) === date ? date : undefined;
  }
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? undefined : toISODateString(d);
}
