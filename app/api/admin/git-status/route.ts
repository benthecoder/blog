import { exec } from "child_process";
import { promisify } from "util";
import { NextResponse } from "next/server";

const execAsync = promisify(exec);

export async function GET() {
  try {
    const { stdout } = await execAsync("git status --porcelain posts/");

    const draftMap: Record<string, "new" | "modified"> = {};

    const lines = stdout
      .trim()
      .split("\n")
      .filter((line) => line);

    for (const line of lines) {
      const status = line.substring(0, 2);
      const filePath = line.substring(3);

      // Extract slug from file path (e.g., "posts/010125.md" -> "010125")
      const match = filePath.match(/posts\/(.+)\.md$/);
      if (match) {
        const slug = match[1];

        if (status.includes("?")) {
          draftMap[slug] = "new";
        } else if (status.includes("M")) {
          draftMap[slug] = "modified";
        }
      }
    }

    return NextResponse.json({ drafts: draftMap });
  } catch (error) {
    console.error("Git status error:", error);
    return NextResponse.json({ drafts: {} });
  }
}
