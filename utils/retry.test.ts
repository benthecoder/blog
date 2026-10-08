import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { withRetry } from "./retry";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("provider request lifecycle", () => {
  it("releases every deadline after successful requests", async () => {
    for (let i = 0; i < 100; i++) {
      expect(await withRetry(async () => i)).toBe(i);
    }
    expect(vi.getTimerCount()).toBe(0);
  });

  it("preserves non-retriable failures with malformed error fields", async () => {
    const failure = { message: 123 };
    const operation = vi.fn().mockRejectedValue(failure);
    await expect(withRetry(operation)).rejects.toBe(failure);
    expect(operation).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("cleans up the deadline when an operation throws synchronously", async () => {
    const failure = new Error("Invalid input");
    await expect(
      withRetry(() => {
        throw failure;
      })
    ).rejects.toBe(failure);
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each([
    { statusCode: 429 },
    { status: 503 },
    { response: { status: 429 } },
  ])(
    "retries provider status errors with bounded exponential backoff: %j",
    async (failure) => {
      const operation = vi
        .fn()
        .mockRejectedValueOnce(failure)
        .mockRejectedValueOnce(failure)
        .mockResolvedValue("ok");
      const onRetry = vi.fn();
      const request = withRetry(operation, {
        maxRetries: 2,
        initialDelay: 10,
        onRetry,
      });
      const result = expect(request).resolves.toBe("ok");
      await vi.advanceTimersByTimeAsync(30);
      await result;
      expect(operation).toHaveBeenCalledTimes(3);
      expect(
        onRetry.mock.calls.map(([, attempt, delay]) => [attempt, delay])
      ).toEqual([
        [1, 10],
        [2, 20],
      ]);
      expect(vi.getTimerCount()).toBe(0);
    }
  );

  it("aborts timed-out work before starting the next attempt", async () => {
    const signals: AbortSignal[] = [];
    let active = 0;
    let maximumActive = 0;
    const request = withRetry(
      (signal) => {
        signals.push(signal);
        active++;
        maximumActive = Math.max(maximumActive, active);
        if (signals.length === 2) {
          active--;
          return Promise.resolve("recovered");
        }
        return new Promise<string>((_, reject) => {
          signal.addEventListener(
            "abort",
            () => {
              active--;
              reject(signal.reason);
            },
            { once: true }
          );
        });
      },
      { maxRetries: 1, timeout: 20, initialDelay: 10, onRetry: () => {} }
    );
    const result = expect(request).resolves.toBe("recovered");
    await vi.advanceTimersByTimeAsync(30);
    await result;
    expect(signals[0].aborted).toBe(true);
    expect(signals[0].reason.code).toBe("ETIMEDOUT");
    expect(signals[1].aborted).toBe(false);
    expect(signals[1]).not.toBe(signals[0]);
    expect(maximumActive).toBe(1);
    expect(active).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("stops at the configured retry limit and releases its final deadline", async () => {
    const failure = { statusCode: 429 };
    const operation = vi.fn().mockRejectedValue(failure);
    const request = withRetry(operation, {
      maxRetries: 1,
      initialDelay: 10,
      onRetry: () => {},
    });
    const result = expect(request).rejects.toBe(failure);
    await vi.advanceTimersByTimeAsync(10);
    await result;
    expect(operation).toHaveBeenCalledTimes(2);
    expect(vi.getTimerCount()).toBe(0);
  });
});
