import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { load } from "js-yaml";
import { describe, expect, it } from "vitest";

type Workflow = {
  jobs: { checks: { steps: { name?: string; run?: string }[] } };
};

const workflow = load(
  fs.readFileSync(path.resolve(".github/workflows/ci.yml"), "utf8")
) as Workflow;
const step = workflow.jobs.checks.steps.find(
  ({ run }) =>
    run?.includes("pnpm build") || run?.includes("pnpm exec next build")
);

function buildCommands(connection: string | undefined) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ci-build-"));
  try {
    const executable = path.join(dir, "pnpm");
    fs.writeFileSync(executable, '#!/bin/sh\nprintf "%s\\n" "$*"\n', {
      mode: 0o755,
    });
    const env: NodeJS.ProcessEnv = {
      ...process.env,
      PATH: `${dir}:${process.env.PATH}`,
    };
    delete env.POSTGRES_URL;
    if (connection !== undefined) env.POSTGRES_URL = connection;
    return execFileSync("bash", ["-e", "-c", step!.run!], {
      env,
      encoding: "utf8",
    })
      .trim()
      .split("\n");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

describe("CI production build", () => {
  it.each([undefined, ""])(
    "compiles without prerendering when the database secret is %s",
    (connection) => {
      expect(buildCommands(connection)).toEqual([
        "run generate:knowledge-map",
        "exec next build --experimental-build-mode compile",
      ]);
    }
  );

  it("keeps the complete build when the database secret is available", () => {
    expect(
      buildCommands("postgresql://fixture:fixture@example.invalid/blog")
    ).toEqual([
      "run generate:knowledge-map",
      "exec next build",
      "exec next-sitemap",
    ]);
  });
});
