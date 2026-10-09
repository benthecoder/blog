import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { splitKnowledgeMap } from "./mapAssets";
import type { KnowledgeMapOutput } from "@/types/knowledgeMap";

const root = process.cwd();
const run = (cwd: string) =>
  execFileSync(
    process.execPath,
    [
      path.join(root, "node_modules/tsx/dist/cli.mjs"),
      path.join(root, "scripts/generateKnowledgeMap.ts"),
    ],
    {
      cwd,
      env: {
        ...process.env,
        VERCEL: "1",
        POSTGRES_URL: "invalid-for-this-test",
        TSX_TSCONFIG_PATH: path.join(root, "tsconfig.json"),
      },
      stdio: "pipe",
    }
  );

describe("deployment knowledge map preparation", () => {
  it("prepares matching browser assets without requiring a working database", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "map-build-"));
    const dataDir = path.join(cwd, "public/data");
    const map = JSON.parse(
      fs.readFileSync(path.join(root, "public/data/knowledge-map.json"), "utf8")
    ) as KnowledgeMapOutput;
    const original = JSON.stringify(map);
    try {
      fs.mkdirSync(dataDir, { recursive: true });
      fs.writeFileSync(path.join(dataDir, "knowledge-map.json"), original);
      expect(run(cwd).toString()).toContain("no provider query");
      const expected = splitKnowledgeMap(map);
      expect(
        fs.readFileSync(path.join(dataDir, "knowledge-map-nodes.json"), "utf8")
      ).toBe(expected.previewJson);
      expect(
        fs.readFileSync(path.join(dataDir, expected.edgesFilename), "utf8")
      ).toBe(expected.edgesJson);
      if (expected.summariesFilename) {
        expect(
          fs.readFileSync(
            path.join(dataDir, expected.summariesFilename),
            "utf8"
          )
        ).toBe(expected.summariesJson);
      }
      expect(
        fs.readFileSync(path.join(dataDir, "knowledge-map.json"), "utf8")
      ).toBe(original);
    } finally {
      fs.rmSync(cwd, { recursive: true, force: true });
    }
  });
  it("fails clearly if the committed snapshot is missing rather than contacting providers", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "map-build-"));
    try {
      expect(() => run(cwd)).toThrow("Committed knowledge-map.json is missing");
    } finally {
      fs.rmSync(cwd, { recursive: true, force: true });
    }
  });
});
