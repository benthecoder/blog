// Server-only: shells out to the local PhotoKit helper (scripts/photokit).
import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { PHOTOKIT_BIN, PHOTO_FULL_DIR, PHOTO_THUMBS_DIR } from "@/config/paths";

type IndexedPhoto = { id: string; name: string; time: string };

export type PhotosResult =
  | { ok: true; photos: IndexedPhoto[] }
  | { ok: false; reason: "not-built" | "denied" };

const PHOTO_ID_RE =
  /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}\/L0\/\d{3}$/i;

export function isValidPhotoId(id: unknown): id is string {
  return typeof id === "string" && PHOTO_ID_RE.test(id);
}

export function isValidDate(date: unknown): date is string {
  return typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date);
}

// Only call with ids that passed isValidPhotoId.
const safeId = (id: string) => id.replace(/\//g, "_");

export const thumbPath = (id: string) =>
  path.join(PHOTO_THUMBS_DIR, `${safeId(id)}.jpg`);

/** Runs the helper; resolves with its parsed JSON stdout. A helper that exits
 * non-zero still prints a JSON error, which is returned rather than thrown. */
function runHelper(args: string[], timeout: number): Promise<unknown> {
  return new Promise((resolve, reject) => {
    execFile(
      PHOTOKIT_BIN,
      args,
      { timeout, maxBuffer: 32 * 1024 * 1024 },
      (err, stdout) => {
        try {
          resolve(JSON.parse(stdout));
        } catch {
          reject(err ?? new Error("photokit printed no JSON"));
        }
      }
    );
  });
}

const dayCache = new Map<string, IndexedPhoto[]>();
const dayInflight = new Map<string, Promise<PhotosResult>>();

/** Local YYYY-MM-DD. Today (or later) can still gain photos, so it isn't cached. */
function isPastDay(date: string): boolean {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  return date < today;
}

/** Photos taken on `date` (YYYY-MM-DD). Also writes their thumbnails. */
export function getPhotosForDate(date: string): Promise<PhotosResult> {
  const cached = dayCache.get(date);
  if (cached) return Promise.resolve({ ok: true, photos: cached });
  if (!fs.existsSync(PHOTOKIT_BIN)) {
    return Promise.resolve({ ok: false, reason: "not-built" });
  }

  let pending = dayInflight.get(date);
  if (!pending) {
    pending = runHelper(["day", date, PHOTO_THUMBS_DIR], 60_000)
      .then((out): PhotosResult => {
        if (Array.isArray(out)) {
          if (isPastDay(date)) dayCache.set(date, out as IndexedPhoto[]);
          return { ok: true, photos: out as IndexedPhoto[] };
        }
        const error = (out as { error?: string })?.error;
        if (error === "photos-access-denied") {
          return { ok: false, reason: "denied" };
        }
        throw new Error(`photokit: ${error ?? "unexpected output"}`);
      })
      .finally(() => dayInflight.delete(date));
    dayInflight.set(date, pending);
  }
  return pending;
}

const fullInflight = new Map<string, Promise<string>>();

/** Path to a large JPEG of the photo, rendered on first request. */
export function ensureFull(id: string): Promise<string> {
  const file = path.join(PHOTO_FULL_DIR, `${safeId(id)}.jpg`);
  if (fs.existsSync(file)) return Promise.resolve(file);

  let pending = fullInflight.get(id);
  if (!pending) {
    fs.mkdirSync(PHOTO_FULL_DIR, { recursive: true });
    pending = runHelper(["full", id, file], 120_000)
      .then((out) => {
        if (!(out as { ok?: boolean })?.ok) {
          throw new Error(`photokit: ${(out as { error?: string })?.error}`);
        }
        return file;
      })
      .finally(() => fullInflight.delete(id));
    fullInflight.set(id, pending);
  }
  return pending;
}
