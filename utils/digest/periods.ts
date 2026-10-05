import type { LinkItem } from "./types";
import { renderWeekly } from "./renderWeekly";
import { renderMonthly } from "./renderMonthly";
import { renderQuarterly } from "./renderQuarterly";
import {
  footerLines,
  journalPosts,
  monthlyPosts,
  sundayLinksPosts,
  thoughts,
} from "./notes";

export interface Draft {
  title: string;
  slug: string;
  tags: string;
  body: string;
}

export interface PeriodContext {
  now: Date;
  /** Weekly only: window length in days. */
  days: number;
  /** Monthly only: "YYYY-MM" to draft instead of last month. */
  month?: string;
  collectLinks(since: Date, until: Date): Promise<LinkItem[]>;
  nextIssue(): number;
}

export interface Period {
  build(ctx: PeriodContext): Promise<Draft>;
}

const MONTHS = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
];

const pad = (n: number) => String(n).padStart(2, "0");

const weekly: Period = {
  async build(ctx) {
    const { now } = ctx;
    const since = new Date(now.getTime() - ctx.days * 86_400_000);
    const links = await ctx.collectLinks(since, now);
    return {
      title: `sunday links #${ctx.nextIssue()}`,
      slug: `${pad(now.getDate())}${pad(now.getMonth() + 1)}${pad(now.getFullYear() % 100)}`,
      tags: "journal, links",
      body: renderWeekly(links),
    };
  },
};

const monthly: Period = {
  async build(ctx) {
    // Default: the calendar month that just ended. Date rolls month -1 into
    // December of the previous year.
    const base = ctx.month
      ? new Date(
          Number(ctx.month.slice(0, 4)),
          Number(ctx.month.slice(5)) - 1,
          1
        )
      : new Date(ctx.now.getFullYear(), ctx.now.getMonth() - 1, 1);
    const year = base.getFullYear();
    const monthIdx = base.getMonth();
    const since = base;
    const until = new Date(year, monthIdx + 1, 1);

    const weeklies = sundayLinksPosts(since, until);
    return {
      title: `highlights — ${MONTHS[monthIdx]} ${year}`,
      slug: `highlights-${year}-${pad(monthIdx + 1)}`,
      tags: "journal, highlights",
      body: renderMonthly({
        links: await ctx.collectLinks(since, until),
        watching: weeklies.flatMap((p) => footerLines(p.slug, "watch")),
        journal: journalPosts(since, until),
        thoughts: await thoughts(since, until),
      }),
    };
  },
};

const quarterly: Period = {
  async build(ctx) {
    // Default: the quarter that just ended.
    const start = new Date(
      ctx.now.getFullYear(),
      Math.floor(ctx.now.getMonth() / 3) * 3 - 3,
      1
    );
    const year = start.getFullYear();
    const q = start.getMonth() / 3;
    const since = start;
    const until = new Date(year, q * 3 + 3, 1);
    return {
      title: `q${q + 1} ${year} reflection`,
      slug: `q${q + 1}-${year}-reflection`,
      tags: "journal, reflection",
      body: renderQuarterly({
        monthly: monthlyPosts(since, until),
        journal: journalPosts(since, until),
      }),
    };
  },
};

export const PERIODS: Record<string, Period> = { weekly, monthly, quarterly };
