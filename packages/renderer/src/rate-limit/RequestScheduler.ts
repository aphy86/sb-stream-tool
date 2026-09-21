/**
 * Sliding window rate limiter implementation for requests
 * If a request is made when the window is full, it's forced to wait for a certain time before it's added back in
 */

export class RequestScheduler {
  private readonly requestTimes: number[] = [];

  private blockedUntil = 0;

  // stats
  private totalRequests = 0;
  private totalRateLimitsHit = 0;

  constructor(
    private maxRequests: number,
    private readonly windowMs: number,
  ) {}

  private sleep(ms: number, signal?: AbortSignal): Promise<void> {
    if (ms <= 0) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const onAbort = () => {
        clearTimeout(timer);
        resolve();
      };

      const timer = setTimeout(() => {
        signal?.removeEventListener("abort", onAbort);
        resolve();
      }, ms);

      signal?.addEventListener("abort", onAbort, { once: true });
    });
  }

  async acquire(signal?: AbortSignal): Promise<void> {
    let acquired = false;

    while (!acquired) {
      if (signal?.aborted) {
        return;
      }
      const now = performance.now();

      if (now < this.blockedUntil) {
        await this.sleep(this.blockedUntil - now, signal);
      } else {
        while (
          this.requestTimes.length > 0 &&
          now - this.requestTimes[0] >= this.windowMs
        ) {
          this.requestTimes.shift();
        }

        if (this.requestTimes.length < this.maxRequests) {
          this.requestTimes.push(now);
          this.totalRequests++;
          acquired = true;
        } else {
          const oldestRequest = this.requestTimes[0];

          const waitMs = this.windowMs - (now - oldestRequest) + 1;

          await this.sleep(waitMs, signal);
        }
      }
    }
  }

  rateLimitReached(retryMs: number): void {
    this.totalRateLimitsHit++;

    const now = performance.now();

    const delay =
      retryMs > 0
        ? retryMs + Math.random() * 1000
        : this.windowMs + Math.random() * 2000;

    // if you hit the rate limit before the max request limit, shrink the max request limit to the current amount of requests called + 1
    if (this.maxRequests > this.requestTimes.length) {
      this.maxRequests = this.requestTimes.length + 1;
    }

    this.blockedUntil = Math.max(this.blockedUntil, now + delay);
  }

  getStats() {
    return {
      totalRequests: this.totalRequests,
      totalRateLimitsHit: this.totalRateLimitsHit,
    };
  }
}
