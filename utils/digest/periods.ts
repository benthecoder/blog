import type { LinkItem } from "./types";
import type { PeriodKind } from "./schedule";
import { renderWeekly } from "./renderWeekly";
import { renderMonthly } from "./renderMonthly";
import { renderQuarterly } from "./renderQuarterly";
import { getPostMetadata } from "@/utils/content/posts";
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

interface PeriodContext {
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

export interface Window {
  since: Date;
  until: Date;
}

export function weekWindow(now: Date, days: number): Window {
  return { since: new Date(now.getTime() - days * 86_400_000), until: now };
}

/** Calendar month that just ended, or `month` ("YYYY-MM") if given. */
export function monthWindow(now: Date, month?: string): Window {
  let base: Date;
  if (month) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      throw new Error(`--month must look like 2026-09, got "${month}"`);
    }
    base = new Date(Number(month.slice(0, 4)), Number(month.slice(5)) - 1, 1);
  } else {
    // Date rolls month -1 into December of the previous year.
    base = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  }
  return {
    since: base,
    until: new Date(base.getFullYear(), base.getMonth() + 1, 1),
  };
}

/** Calendar quarter that just ended. */
export function quarterWindow(now: Date): Window {
  const since = new Date(
    now.getFullYear(),
    Math.floor(now.getMonth() / 3) * 3 - 3,
    1
  );
  return {
    since,
    until: new Date(since.getFullYear(), since.getMonth() + 3, 1),
  };
}

const weekly: Period = {
  async build(ctx) {
    const { now } = ctx;
    const { since, until } = weekWindow(now, ctx.days);
    const links = await ctx.collectLinks(since, until);
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
    const { since, until } = monthWindow(ctx.now, ctx.month);
    const year = since.getFullYear();
    const monthIdx = since.getMonth();
    const posts = getPostMetadata();

    const weeklies = sundayLinksPosts(posts, since, until);
    return {
      title: `highlights — ${MONTHS[monthIdx]} ${year}`,
      slug: `highlights-${year}-${pad(monthIdx + 1)}`,
      tags: "journal, highlights",
      body: renderMonthly({
        links: await ctx.collectLinks(since, until),
        watching: weeklies.flatMap((p) => footerLines(p.slug, "watch")),
        journal: journalPosts(posts, since, until),
        thoughts: await thoughts(since, until),
      }),
    };
  },
};

const quarterly: Period = {
  async build(ctx) {
    const { since, until } = quarterWindow(ctx.now);
    const year = since.getFullYear();
    const q = since.getMonth() / 3;
    const posts = getPostMetadata();
    return {
      title: `q${q + 1} ${year} reflection`,
      slug: `q${q + 1}-${year}-reflection`,
      tags: "journal, reflection",
      body: renderQuarterly({
        monthly: monthlyPosts(posts, since, until),
        journal: journalPosts(posts, since, until),
      }),
    };
  },
};

export const PERIODS: Record<PeriodKind, Period> = {
  weekly,
  monthly,
  quarterly,
};
