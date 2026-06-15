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
  frontmatter: Record<string, unknown> | null
): Date {
  if (frontmatter?.date) {
    const direct = new Date(frontmatter.date as string);
    if (!isNaN(direct.getTime())) return direct;

    const fromName = parseMonthName(String(frontmatter.date));
    if (fromName) return fromName;

    console.warn(
      `Could not parse date '${frontmatter.date}' from frontmatter in ${filePath}`
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
  return date.toISOString().split("T")[0];
}
