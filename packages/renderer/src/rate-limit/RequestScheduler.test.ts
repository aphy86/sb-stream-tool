import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RequestScheduler } from "./RequestScheduler";
import { PLATFORM_RATE_LIMIT_SCHEDULERS, RATELIMIT_CONFIG } from "./registry";

/**
 * RequestScheduler uses performance.now() and setTimeout, so every test runs on
 * fake timers. That keeps the suite fast (no real waiting) and deterministic.
 */

const WINDOW_MS = 1000;

/** Starts an acquire() and tracks whether it has resolved yet. */
function track(promise: Promise<void>) {
  const state = { done: false };
  promise.then(() => {
    state.done = true;
  });
  return state;
}

/** Lets already-resolved promises run their .then callbacks. */
async function flush() {
  await vi.advanceTimersByTimeAsync(0);
}

beforeEach(() => {
  vi.useFakeTimers({
    toFake: ["setTimeout", "clearTimeout", "performance", "Date"],
  });
  // rateLimitReached() adds random jitter; pin it to 0 so delays are exact.
  vi.spyOn(Math, "random").mockReturnValue(0);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("RequestScheduler: basic limiting", () => {
  it("grants up to maxRequests immediately", async () => {
    const scheduler = new RequestScheduler(3, WINDOW_MS);

    const calls = [
      track(scheduler.acquire()),
      track(scheduler.acquire()),
      track(scheduler.acquire()),
    ];
    await flush();

    expect(calls.every((c) => c.done)).toBe(true);
    expect(scheduler.getStats().totalRequests).toBe(3);
  });

  it("makes the request over the limit wait until the oldest one leaves the window", async () => {
    const scheduler = new RequestScheduler(3, WINDOW_MS);
    for (let i = 0; i < 3; i++) await scheduler.acquire();

    const fourth = track(scheduler.acquire());

    await vi.advanceTimersByTimeAsync(WINDOW_MS - 1);
    expect(fourth.done).toBe(false); // window still full

    await vi.advanceTimersByTimeAsync(2);
    expect(fourth.done).toBe(true); // oldest request expired, slot freed
  });

  it("frees slots as the window slides, not all at once", async () => {
    const scheduler = new RequestScheduler(2, WINDOW_MS);

    await scheduler.acquire(); // t = 0
    await vi.advanceTimersByTimeAsync(500);
    await scheduler.acquire(); // t = 500

    const third = track(scheduler.acquire());
    const fourth = track(scheduler.acquire());

    // At t ≈ 1000 the first request expires: exactly one slot opens.
    await vi.advanceTimersByTimeAsync(502);
    expect([third.done, fourth.done].filter(Boolean)).toHaveLength(1);

    // At t ≈ 1500 the second request expires: the other one goes through.
    await vi.advanceTimersByTimeAsync(500);
    expect(third.done && fourth.done).toBe(true);
  });
});

describe("RequestScheduler: concurrency", () => {
  it("never exceeds maxRequests in any window, even with many concurrent callers", async () => {
    const MAX = 5;
    const TOTAL = 40;
    const scheduler = new RequestScheduler(MAX, WINDOW_MS);
    const grantTimes: number[] = [];

    const all = Array.from({ length: TOTAL }, () =>
      scheduler.acquire().then(() => grantTimes.push(performance.now())),
    );
    await vi.runAllTimersAsync();
    await Promise.all(all);

    expect(grantTimes).toHaveLength(TOTAL);

    // Sliding-window check: from every grant, count grants in the next WINDOW_MS.
    const sorted = [...grantTimes].sort((a, b) => a - b);
    for (const start of sorted) {
      const inWindow = sorted.filter((t) => t >= start && t < start + WINDOW_MS);
      expect(inWindow.length).toBeLessThanOrEqual(MAX);
    }
  });
});

describe("RequestScheduler: 429 handling (rateLimitReached)", () => {
  it("blocks every caller for the server's retry time", async () => {
    const scheduler = new RequestScheduler(10, WINDOW_MS);
    await scheduler.acquire();

    scheduler.rateLimitReached(3000); // server said "retry after 3s" (+0 jitter)
    const next = track(scheduler.acquire());

    await vi.advanceTimersByTimeAsync(2999);
    expect(next.done).toBe(false);

    await vi.advanceTimersByTimeAsync(2);
    expect(next.done).toBe(true);
  });

  it("falls back to a full window of backoff when no retry time is given", async () => {
    const scheduler = new RequestScheduler(10, WINDOW_MS);

    scheduler.rateLimitReached(0);
    const next = track(scheduler.acquire());

    await vi.advanceTimersByTimeAsync(WINDOW_MS - 1);
    expect(next.done).toBe(false);

    await vi.advanceTimersByTimeAsync(2);
    expect(next.done).toBe(true);
  });

  it("shrinks the limit to (requests in window + 1) when a 429 arrives early", async () => {
    const scheduler = new RequestScheduler(10, WINDOW_MS);
    for (let i = 0; i < 3; i++) await scheduler.acquire(); // 3 requests at t = 0

    scheduler.rateLimitReached(100); // blocked until t = 100, limit -> 4

    const waiting = Array.from({ length: 3 }, () => track(scheduler.acquire()));
    await vi.advanceTimersByTimeAsync(101);

    // Old limit (10) would have let all three through; the new limit (4) allows one.
    expect(waiting.filter((w) => w.done)).toHaveLength(1);
  });

  it("counts 429s in stats", () => {
    const scheduler = new RequestScheduler(10, WINDOW_MS);
    scheduler.rateLimitReached(0);
    scheduler.rateLimitReached(0);
    expect(scheduler.getStats().totalRateLimitsHit).toBe(2);
  });

  /**
   * Characterization test: documents CURRENT behavior, not necessarily desired behavior.
   * After a 429, maxRequests shrinks and never grows back, so throughput stays reduced
   * for the rest of the session. If that changes on purpose, update this test.
   */
  it("[current behavior] keeps the shrunken limit even after the window fully clears", async () => {
    const scheduler = new RequestScheduler(10, WINDOW_MS);

    scheduler.rateLimitReached(0); // 0 requests in window -> limit becomes 1
    await vi.advanceTimersByTimeAsync(WINDOW_MS * 5); // long after backoff and window

    const calls = Array.from({ length: 3 }, () => track(scheduler.acquire()));
    await flush();

    expect(calls.filter((c) => c.done)).toHaveLength(1);
  });
});

describe("RequestScheduler: cancellation", () => {
  it("returns promptly when aborted while waiting, without counting a request", async () => {
    const scheduler = new RequestScheduler(1, WINDOW_MS);
    await scheduler.acquire();

    const controller = new AbortController();
    const waiting = track(scheduler.acquire(controller.signal));
    await flush();
    expect(waiting.done).toBe(false);

    controller.abort();
    await flush();

    expect(waiting.done).toBe(true); // did not wait for the window
    expect(scheduler.getStats().totalRequests).toBe(1); // aborted call wasn't counted
  });

  it("returns immediately for an already-aborted signal", async () => {
    const scheduler = new RequestScheduler(1, WINDOW_MS);
    const controller = new AbortController();
    controller.abort();

    await scheduler.acquire(controller.signal);
    expect(scheduler.getStats().totalRequests).toBe(0);
  });
});

/**
 * Regression tests for a real bug: the platform client used to create a fresh
 * RequestScheduler per call, so each one believed it had a full request budget
 * and together they exceeded the API's limit. The fix keeps one shared scheduler
 * per platform in the registry.
 */
describe("Regression: one shared scheduler per platform", () => {
  it("returns the same scheduler instance on every lookup", () => {
    const first = PLATFORM_RATE_LIMIT_SCHEDULERS.get("startgg");
    const second = PLATFORM_RATE_LIMIT_SCHEDULERS.get("startgg");
    expect(first).toBeInstanceOf(RequestScheduler);
    expect(first).toBe(second);
  });

  it("keeps platforms independent (start.gg traffic doesn't use parry.gg's budget)", () => {
    expect(PLATFORM_RATE_LIMIT_SCHEDULERS.get("startgg")).not.toBe(
      PLATFORM_RATE_LIMIT_SCHEDULERS.get("parrygg"),
    );
  });

  it("enforces the API limit across all callers that share the scheduler", async () => {
    const { maxRequests, windowMs } = RATELIMIT_CONFIG.startgg;
    const shared = new RequestScheduler(maxRequests, windowMs);

    // Simulate two parts of the app fetching at once, each asking for a full budget.
    const callerA = Array.from({ length: maxRequests }, () => track(shared.acquire()));
    const callerB = Array.from({ length: maxRequests }, () => track(shared.acquire()));
    await flush();

    const granted = [...callerA, ...callerB].filter((c) => c.done).length;
    expect(granted).toBe(maxRequests); // combined, never more than the API allows
  });

  it("demonstrates the old bug: separate schedulers together exceed the limit", async () => {
    const { maxRequests, windowMs } = RATELIMIT_CONFIG.startgg;
    const perCallA = new RequestScheduler(maxRequests, windowMs);
    const perCallB = new RequestScheduler(maxRequests, windowMs);

    const calls = [
      ...Array.from({ length: maxRequests }, () => track(perCallA.acquire())),
      ...Array.from({ length: maxRequests }, () => track(perCallB.acquire())),
    ];
    await flush();

    // Each instance thinks it's within budget, so 2x the API limit goes out.
    expect(calls.filter((c) => c.done).length).toBe(maxRequests * 2);
  });
});
