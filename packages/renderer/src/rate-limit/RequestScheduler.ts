import { RateLimit } from "@renderer/types/rate-limit";

/**
 * bucket token-based request scheduling algorithm, allows for burst data fetches
 */
export class RequestScheduler {
  private tokens: number;
  private lastRefillAt: number;

  private blockedUntil: number;

  // stats
  private totalRequests: number;
  private totalRateLimitsHit: number;

  constructor(
    private readonly rateLimit: RateLimit,
    private readonly burstCapacity: number,
  ) {
    this.tokens = burstCapacity;
    this.lastRefillAt = performance.now();
    this.blockedUntil = 0;

    this.totalRequests = 0;
    this.totalRateLimitsHit = 0;
  }

  private async sleep(ms: number): Promise<void> {
    if (ms <= 0) {
      return;
    }

    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private refillTokens(now: number): void {
    const elapsedMs = now - this.lastRefillAt;

    if (elapsedMs <= 0) {
      return;
    }

    const tokensPerMs = this.rateLimit.maxRequests / this.rateLimit.windowMs;

    const tokensToAdd = elapsedMs * tokensPerMs;

    this.tokens = Math.min(this.burstCapacity, this.tokens + tokensToAdd);

    this.lastRefillAt = now;
  }

  // will eventually be true, because at some point, there will be enough tokens to stop the function
  async acquire(): Promise<void> {
    let acquired = false;

    while (!acquired) {
      const now = performance.now();

      if (now < this.blockedUntil) {
        await this.sleep(this.blockedUntil - now);
      } else {
        this.refillTokens(now);

        if (this.tokens >= 1) {
          this.tokens -= 1;
          this.totalRequests++;
          acquired = true;
        } else {
          const tokensPerMs =
            this.rateLimit.maxRequests / this.rateLimit.windowMs;

          const waitTimeMs = Math.ceil((1 - this.tokens) / tokensPerMs);

          await this.sleep(waitTimeMs);
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
        : this.rateLimit.windowMs + Math.random() * 2000;

    const blockedUntil = now + delay;

    this.blockedUntil = Math.max(this.blockedUntil, blockedUntil);

    this.tokens = 0;
    this.lastRefillAt = this.blockedUntil;
  }
}
