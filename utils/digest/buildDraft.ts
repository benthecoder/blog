import { collectLinks, nextIssueNumber } from "./collect";
import { PERIODS, type Draft } from "./periods";
import { periodAnchor, type PeriodKind } from "./schedule";

/** Draft for the period of `kind` that ends on `date`. */
export function buildDraft(kind: PeriodKind, date: Date): Promise<Draft> {
  return PERIODS[kind].build({
    ...periodAnchor(kind, date),
    days: 7,
    collectLinks,
    nextIssue: nextIssueNumber,
  });
}
