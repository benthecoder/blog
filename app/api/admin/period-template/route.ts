import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/utils/adminAuth";
import { buildDraft } from "@/utils/digest/buildDraft";
import type { PeriodKind } from "@/utils/digest/schedule";

export const dynamic = "force-dynamic";

const KINDS: PeriodKind[] = ["weekly", "monthly", "quarterly"];

// Template for the special post on a given day (sunday links, month-end
// highlights, quarter-end reflection). Collects only; takes stay blank.
export async function GET(request: NextRequest) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const kind = searchParams.get("kind") as PeriodKind;
  const dateParam = searchParams.get("date") ?? "";
  const m = dateParam.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!KINDS.includes(kind) || !m) {
    return NextResponse.json(
      { error: "kind and date (YYYY-MM-DD) required" },
      { status: 400 }
    );
  }

  try {
    const draft = await buildDraft(
      kind,
      new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
    );
    return NextResponse.json({
      title: draft.title,
      tags: draft.tags,
      body: draft.body,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to build template" },
      { status: 500 }
    );
  }
}
