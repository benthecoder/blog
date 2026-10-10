import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/utils/adminAuth";
import { DEFINE_BIN, DEFINE_SRC } from "@/config/paths";

const run = promisify(execFile);

// Looks a word up in the Mac's built-in dictionary, offline. The helper
// only exists locally; it's compiled on first use.
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const authError = checkAdminAuth(request);
  if (authError) return authError;

  const word = request.nextUrl.searchParams.get("word") ?? "";
  if (!/^[A-Za-z][A-Za-z'-]{0,39}$/.test(word)) {
    return NextResponse.json({ error: "Invalid word" }, { status: 400 });
  }

  try {
    if (!fs.existsSync(DEFINE_BIN)) {
      fs.mkdirSync(path.dirname(DEFINE_BIN), { recursive: true });
      await run("swiftc", ["-O", DEFINE_SRC, "-o", DEFINE_BIN], {
        timeout: 120_000,
      });
    }
    const { stdout } = await run(DEFINE_BIN, [word], { timeout: 5_000 });
    return NextResponse.json({ definition: stdout.trim() });
  } catch (error) {
    // The helper exits 1 when the dictionary has no entry.
    if ((error as { code?: unknown }).code === 1) {
      return NextResponse.json({ definition: null });
    }
    console.error("Define error:", error);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}
