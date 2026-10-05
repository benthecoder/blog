// Pure date logic, safe to import from client components.

export type PeriodKind = "weekly" | "monthly" | "quarterly";

export const PERIOD_LABELS: Record<PeriodKind, string> = {
  weekly: "sunday links",
  monthly: "highlights",
  quarterly: "reflection",
};

/** Which special templates fit this date, most likely first. */
export function suggestPeriods(date: Date): PeriodKind[] {
  const out: PeriodKind[] = [];
  const next = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + 1
  );
  const lastOfMonth = next.getDate() === 1;

  if (date.getDay() === 0) out.push("weekly");
  if (lastOfMonth) out.push("monthly");
  if (lastOfMonth && date.getMonth() % 3 === 2) out.push("quarterly");
  return out;
}

/**
 * Inputs for PERIODS[kind].build so the draft covers the period that ends on
 * `date`, rather than the one before it (which is what the CLI wants when run
 * the day after).
 */
export function periodAnchor(
  kind: PeriodKind,
  date: Date
): { now: Date; month?: string } {
  const dayAfter = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + 1
  );
  if (kind === "monthly") {
    const m = String(date.getMonth() + 1).padStart(2, "0");
    return { now: dayAfter, month: `${date.getFullYear()}-${m}` };
  }
  // weekly: window ends after `date`; quarterly: "previous quarter" of the
  // day after the quarter's last day is the quarter that just ended.
  return { now: dayAfter };
}
