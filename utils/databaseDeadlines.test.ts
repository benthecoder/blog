import { NextRequest } from "next/server";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  query: vi.fn(),
  sql: vi.fn(),
  options: [] as Array<{ fetchOptions: { signal: AbortSignal } }>,
  embed: vi.fn(),
}));
vi.mock("@neondatabase/serverless", () => ({
  neon: (_url: string, options?: { fetchOptions: { signal: AbortSignal } }) => {
    if (options) mocks.options.push(options);
    return Object.assign(mocks.sql, { query: mocks.query });
  },
}));
vi.mock("@/utils/clients", () => ({
  getVoyageClient: () => ({ embed: mocks.embed }),
}));
import { POST as search } from "@/app/api/search/route";
import { GET as thoughts } from "@/app/api/thoughts/route";
import { tweets } from "./digest/sources/tweets";

beforeEach(() => {
  vi.useFakeTimers();
  mocks.query.mockReset().mockResolvedValue([]);
  mocks.sql.mockReset().mockResolvedValue([]);
  mocks.options.length = 0;
  mocks.embed
    .mockReset()
    .mockResolvedValue({ data: [{ embedding: Array(1024).fill(0.1) }] });
  vi.spyOn(AbortSignal, "timeout").mockImplementation((delay) => {
    const controller = new AbortController();
    setTimeout(
      () => controller.abort(new DOMException("Timed out", "TimeoutError")),
      delay
    );
    return controller.signal;
  });
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});
function untilAborted(signal: AbortSignal): Promise<never> {
  signal.throwIfAborted();
  return new Promise((_, reject) =>
    signal.addEventListener("abort", () => reject(signal.reason), {
      once: true,
    })
  );
}
const searchRequest = (signal?: AbortSignal) =>
  new Request("http://localhost/api/search", {
    method: "POST",
    body: JSON.stringify({ query: "jazz", searchType: "semantic" }),
    signal,
  });

it("shares the search deadline with the fallback instead of starting a fresh budget", async () => {
  const signals: AbortSignal[] = [];
  mocks.query.mockImplementation(async (_statement, _params, options) => {
    const signal = options.fetchOptions.signal;
    signals.push(signal);
    if (signals.length === 1) {
      await new Promise<void>((resolve) => setTimeout(resolve, 12_000));
      return [];
    }
    return untilAborted(signal);
  });
  const operation = search(searchRequest());
  await vi.advanceTimersByTimeAsync(20_000);
  expect((await operation).status).toBe(500);
  expect(mocks.query).toHaveBeenCalledTimes(2);
  expect(signals[0]).toBe(signals[1]);
  expect(signals[1].aborted).toBe(true);
});

it("propagates an incoming cancellation to database fetch options", async () => {
  mocks.query.mockImplementation((_statement, _params, options) =>
    untilAborted(options.fetchOptions.signal)
  );
  const controller = new AbortController();
  const operation = search(searchRequest(controller.signal));
  await vi.advanceTimersByTimeAsync(0);
  controller.abort();
  expect((await operation).status).toBe(500);
  expect(mocks.query).toHaveBeenCalledOnce();
});

it("gives a thoughts request a fresh deadline after an earlier timeout", async () => {
  mocks.sql.mockImplementationOnce(() =>
    untilAborted(mocks.options.at(-1)!.fetchOptions.signal)
  );
  const failed = thoughts(new NextRequest("http://localhost/api/thoughts"));
  await vi.advanceTimersByTimeAsync(10_000);
  const response = await failed;
  expect(response.status).toBe(500);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(
    (await thoughts(new NextRequest("http://localhost/api/thoughts"))).status
  ).toBe(200);
  expect(mocks.options[1].fetchOptions.signal.aborted).toBe(false);
  expect(mocks.options[0].fetchOptions.signal).not.toBe(
    mocks.options[1].fetchOptions.signal
  );
});

it("bounds draft-link reads and rejects failures instead of returning an incomplete list", async () => {
  mocks.sql.mockImplementationOnce(() =>
    untilAborted(mocks.options.at(-1)!.fetchOptions.signal)
  );
  const operation = tweets.fetch(
    new Date("2026-01-01"),
    new Date("2026-02-01")
  );
  const rejected = expect(operation).rejects.toMatchObject({
    name: "TimeoutError",
  });
  await vi.advanceTimersByTimeAsync(10_000);
  await rejected;
  expect(
    await tweets.fetch(new Date("2026-01-01"), new Date("2026-02-01"))
  ).toEqual([]);
});
