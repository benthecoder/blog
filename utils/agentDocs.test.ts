import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

function collectSkillFiles(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectSkillFiles(full, out);
    else if (entry.name.endsWith(".md")) out.push(full);
  }
  return out;
}

describe("agent documentation file references", () => {
  it("points only to existing repository files in AGENTS.md and .agents/skills", () => {
    const docs = [
      path.join(ROOT, "AGENTS.md"),
      ...collectSkillFiles(path.join(ROOT, ".agents/skills")),
    ];
    const refPattern =
      /`((?:app|components|config|data|docs|lib|scripts|templates|tests|types|utils|\.agents)\/[A-Za-z0-9_./[\]-]+\.(?:ts|tsx|js|json|css|md|sh|yaml))`/g;
    const missing: string[] = [];

    for (const doc of docs) {
      const relDoc = path.relative(ROOT, doc);
      const text = fs.readFileSync(doc, "utf8");
      for (const match of text.matchAll(refPattern)) {
        const candidate = match[1];
        if (
          !fs.existsSync(path.join(ROOT, candidate)) &&
          !fs.existsSync(path.join(path.dirname(doc), candidate))
        ) {
          missing.push(`${relDoc} -> ${candidate}`);
        }
      }
    }

    expect(missing).toEqual([]);
  });
});
