export class RequestScheduler {
  private readonly requestTimes: number[] = [];

  private blockedUntil = 0;

  // stats
  private totalRequests = 0;
  private totalRateLimitsHit = 0;

  constructor(
    private readonly maxRequests: number,
    private readonly windowMs: number,
  ) {}

  private sleep(ms: number, signal?: AbortSignal): Promise<void> {
    if (ms <= 0) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const onAbort = () => {
        console.log("Aborting sleep");
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
        console.log("Aborted");
        return;
      }
      const now = performance.now();

      if (now < this.blockedUntil) {
        await this.sleep(this.blockedUntil - now, signal);
      } else {
        // Remove requests that have fallen outside
        // the rolling window.
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
          // The oldest request determines when another
          // request can enter the window.
          const oldestRequest = this.requestTimes[0];

          const waitMs = this.windowMs - (now - oldestRequest) + 1;

          await this.sleep(waitMs, signal);
        }
      }
      // console.log(this.requestTimes);
    }
  }

  rateLimitReached(retryMs: number): void {
    this.totalRateLimitsHit++;

    const now = performance.now();

    const delay =
      retryMs > 0
        ? retryMs + Math.random() * 1000
        : this.windowMs + Math.random() * 2000;

    this.blockedUntil = Math.max(this.blockedUntil, now + delay);
  }

  getStats() {
    return {
      totalRequests: this.totalRequests,
      totalRateLimitsHit: this.totalRateLimitsHit,
    };
  }
}
