/**
 * Date parsing and formatting utilities
 * Consolidates date handling logic across the application
 */

/**
 * Month name to index mapping for parsing dates
 */
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

/**
 * Extract date from frontmatter with improved parsing
 * Supports multiple date formats and falls back to filename parsing
 *
 * @param filePath - Path to the markdown file
 * @param frontmatter - Frontmatter object from gray-matter
 * @returns Parsed Date object
 */
export function extractPostDate(filePath: string, frontmatter: any): Date {
  // Always prioritize frontmatter date if available
  if (frontmatter?.date) {
    // Try multiple date parsing approaches
    // Approach 1: Direct Date constructor (handles ISO formats and many common formats)
    const parsedDate = new Date(frontmatter.date);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate;
    }

    // Approach 2: Handle month name formats like "Jun 1, 2024" or "June 1 2024"
    const monthNameMatch = String(frontmatter.date).match(
      /([A-Za-z]+)\s+(\d{1,2})(?:,?\s+)?(\d{4})/
    );
    if (monthNameMatch) {
      const [_, month, day, year] = monthNameMatch;
      const monthIndex = MONTH_MAP[month.toLowerCase()];
      if (monthIndex !== undefined) {
        const formattedDate = new Date(
          parseInt(year),
          monthIndex,
          parseInt(day)
        );
        if (!isNaN(formattedDate.getTime())) {
          return formattedDate;
        }
      }
    }

    // Log warning if we have a date field but couldn't parse it
    console.warn(
      `Warning: Could not parse date '${frontmatter.date}' from frontmatter in ${filePath}`
    );
  }

  // Try to parse from filename as fallback (e.g., MMDDYY.md format)
  const filenameMatch = filePath.match(/(\d{2})(\d{2})(\d{2})\.md$/);
  if (filenameMatch) {
    const [_, month, day, year] = filenameMatch;
    const fullYear = parseInt(`20${year}`); // Assuming 20xx years
    const dateFromFilename = new Date(
      fullYear,
      parseInt(month) - 1,
      parseInt(day)
    );
    return dateFromFilename;
  }

  // Use a stable default date for posts with no date instead of current date
  // Using January 1, 2020 as a reasonable default that will still sort correctly
  const defaultDate = new Date(2020, 0, 1);
  console.warn(
    `Warning: No date found for ${filePath}, using default date ${defaultDate.toISOString()}`
  );
  return defaultDate;
}

/**
 * Format a Date object to ISO date string (YYYY-MM-DD)
 * Commonly used for database storage and comparisons
 *
 * @param date - Date object to format
 * @returns ISO date string (YYYY-MM-DD)
 */
export function toISODateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Parse a date string in multiple formats
 * Handles ISO dates, month names, and other common formats
 *
 * @param dateStr - Date string to parse
 * @returns Parsed Date object or null if parsing fails
 */
export function parseFlexibleDate(dateStr: string): Date | null {
  // Try direct parsing first
  const directParse = new Date(dateStr);
  if (!isNaN(directParse.getTime())) {
    return directParse;
  }

  // Try month name format
  const monthNameMatch = dateStr.match(
    /([A-Za-z]+)\s+(\d{1,2})(?:,?\s+)?(\d{4})/
  );
  if (monthNameMatch) {
    const [_, month, day, year] = monthNameMatch;
    const monthIndex = MONTH_MAP[month.toLowerCase()];
    if (monthIndex !== undefined) {
      const date = new Date(parseInt(year), monthIndex, parseInt(day));
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }

  return null;
}
