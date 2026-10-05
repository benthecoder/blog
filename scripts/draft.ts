// Drafts a periodic post into posts/drafts/. Collects from every registered
// link source; the takes and reflections are yours to write.
//
//   pnpm draft weekly [--days 7] [--sources curius,tweets]
//   pnpm draft monthly [--month 2026-09]
//   pnpm draft quarterly
import * as dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import { DRAFTS_DIR, getDraftPath } from "@/config/paths";
import { collectLinks, nextIssueNumber } from "@/utils/digest/collect";
import { PERIODS } from "@/utils/digest/periods";
import type { PeriodKind } from "@/utils/digest/schedule";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}

function collect(since: Date, until: Date) {
  const names = arg("sources")?.split(",");
  return collectLinks(since, until, names);
}

async function main() {
  const kind = process.argv[2];
  const period = PERIODS[kind as PeriodKind];
  if (!period) {
    throw new Error(`usage: pnpm draft <${Object.keys(PERIODS).join("|")}>`);
  }

  const now = new Date();
  const draft = await period.build({
    now,
    days: Number(arg("days") ?? 7),
    month: arg("month"),
    collectLinks: collect,
    nextIssue: nextIssueNumber,
  });

  const file = getDraftPath(draft.slug);
  if (fs.existsSync(file)) {
    throw new Error(`${file} already exists, not overwriting`);
  }

  const date = now.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const front = `---\ntitle: '${draft.title}'\ntags: '${draft.tags}'\ndate: '${date}'\n---\n\n`;

  fs.mkdirSync(DRAFTS_DIR, { recursive: true });
  fs.writeFileSync(file, front + draft.body);
  console.log(`wrote ${file}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
