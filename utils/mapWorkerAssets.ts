import fs from "node:fs";
import path from "node:path";

/** MapLibre's module worker imports a sibling chunk outside the bundle graph. */
export function prepareMapWorkerAssets(packageFile: string, publicDir: string) {
  const { version } = JSON.parse(fs.readFileSync(packageFile, "utf8")) as {
    version: string;
  };
  const target = path.join(publicDir, "vendor", "maplibre", version);
  fs.mkdirSync(target, { recursive: true });
  for (const file of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]) {
    fs.copyFileSync(
      path.join(path.dirname(packageFile), "dist", file),
      path.join(target, file)
    );
  }
}
