import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/utils/adminAuth";
import { DRAFTS_DIR } from "@/config/paths";
import { scanMarkdownDir } from "@/utils/content/markdown";
import { draftQueue } from "@/utils/adminDraftQueue";

export async function GET(request: NextRequest) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;
  const drafts = scanMarkdownDir(DRAFTS_DIR).map(({slug, data}) => ({
    slug, title: String(data.title ?? "Untitled"), date: String(data.date ?? ""), isDraft: true,
  }));
  return NextResponse.json(draftQueue(drafts), {headers: {"Cache-Control": "no-store"}});
}
