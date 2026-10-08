import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const helper = vi.hoisted(() => vi.fn());
vi.mock("fs", () => ({ default: { existsSync: () => true } }));
vi.mock("child_process", () => ({ execFile: helper }));
const photo = { id: "asset/L0/001", name: "IMG_1234.HEIC", time: "12:00" };

beforeEach(() => {
  vi.resetModules();
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 6, 12));
  helper.mockReset().mockImplementation((_file, _args, _options, callback) => {
    callback(null, JSON.stringify([photo]));
  });
});
afterEach(() => vi.useRealTimers());

describe("local photo day cache", () => {
  it("shares an in-flight scan and reuses a recent past-day result", async () => {
    const { getPhotosForDate } = await import("./photos");
    const first = getPhotosForDate("2026-10-01");
    const second = getPhotosForDate("2026-10-01");
    expect(second).toBe(first);
    expect(await first).toEqual({ ok: true, photos: [photo] });
    await getPhotosForDate("2026-10-01");
    expect(helper).toHaveBeenCalledTimes(1);
  });

  it("refreshes an old day after five minutes so imported photos appear", async () => {
    const { getPhotosForDate } = await import("./photos");
    await getPhotosForDate("2026-10-01");
    vi.advanceTimersByTime(5 * 60_000);
    helper.mockImplementation((_file, _args, _options, callback) => {
      callback(
        null,
        JSON.stringify([photo, { ...photo, id: "imported/L0/001" }])
      );
    });
    const refreshed = await getPhotosForDate("2026-10-01");
    expect(refreshed.ok && refreshed.photos).toHaveLength(2);
    expect(helper).toHaveBeenCalledTimes(2);
  });

  it("keeps a recently reopened day when the 32-day cache fills", async () => {
    const { getPhotosForDate } = await import("./photos");
    const dates = Array.from({ length: 33 }, (_, day) => {
      const date = new Date(Date.UTC(2026, 7, day + 1));
      return date.toISOString().slice(0, 10);
    });
    for (const date of dates.slice(0, 32)) await getPhotosForDate(date);
    await getPhotosForDate(dates[0]);
    await getPhotosForDate(dates[32]);
    await getPhotosForDate(dates[0]);
    expect(helper).toHaveBeenCalledTimes(33);
    await getPhotosForDate(dates[1]);
    expect(helper).toHaveBeenCalledTimes(34);
  });

  it("does not retain today or future days", async () => {
    const { getPhotosForDate } = await import("./photos");
    for (const date of ["2026-10-06", "2026-10-07"]) {
      await getPhotosForDate(date);
      await getPhotosForDate(date);
    }
    expect(helper).toHaveBeenCalledTimes(4);
  });

  it("does not retain a denied scan and retries after access changes", async () => {
    const { getPhotosForDate } = await import("./photos");
    helper.mockImplementationOnce((_file, _args, _options, callback) => {
      callback(
        new Error("denied"),
        JSON.stringify({ error: "photos-access-denied" })
      );
    });
    expect(await getPhotosForDate("2026-10-01")).toEqual({
      ok: false,
      reason: "denied",
    });
    expect(await getPhotosForDate("2026-10-01")).toEqual({
      ok: true,
      photos: [photo],
    });
    expect(helper).toHaveBeenCalledTimes(2);
  });
});
