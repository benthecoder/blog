import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { expect, it } from "vitest";
import { prepareMapWorkerAssets } from "./mapWorkerAssets";

it("serves the worker and its matching shared module under the installed version", () => {
  const publicDir = fs.mkdtempSync(path.join(os.tmpdir(), "map-worker-"));
  const packageFile = createRequire(import.meta.url).resolve(
    "maplibre-gl/package.json"
  );
  const { version } = JSON.parse(fs.readFileSync(packageFile, "utf8"));
  try {
    prepareMapWorkerAssets(packageFile, publicDir);
    for (const file of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]) {
      expect(
        fs.readFileSync(
          path.join(publicDir, "vendor", "maplibre", version, file)
        )
      ).toEqual(
        fs.readFileSync(path.join(path.dirname(packageFile), "dist", file))
      );
    }
  } finally {
    fs.rmSync(publicDir, { recursive: true, force: true });
  }
});
