import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

/** Commit complete file contents; exclusive creates never replace a destination. */
export function writeAtomicFile(
  filePath: string,
  content: string | Uint8Array,
  { exclusive = false }: { exclusive?: boolean } = {}
) {
  const directory = path.dirname(filePath);
  fs.mkdirSync(directory, { recursive: true });
  const temporaryPath = path.join(directory, `.${randomUUID()}.tmp`);
  try {
    fs.writeFileSync(temporaryPath, content);
    if (exclusive) fs.linkSync(temporaryPath, filePath);
    else fs.renameSync(temporaryPath, filePath);
  } finally {
    fs.rmSync(temporaryPath, { force: true });
  }
}
