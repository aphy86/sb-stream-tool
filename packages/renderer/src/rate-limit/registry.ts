import { PlatformId } from "@renderer/types/platform";
import { RateLimit } from "@renderer/types/rate-limit";
import { RequestScheduler } from "./RequestScheduler";

export const RATELIMIT_CONFIG: Record<PlatformId, RateLimit> = {
  startgg: {
    maxRequests: 75,
    windowMs: 60000,
  },

  parrygg: {
    maxRequests: 75,
    windowMs: 60000,
  },
};

export const PLATFORM_RATE_LIMIT_SCHEDULERS: Map<PlatformId, RequestScheduler> =
  new Map([
    ["startgg", new RequestScheduler(RATELIMIT_CONFIG.startgg, 4)],
    ["parrygg", new RequestScheduler(RATELIMIT_CONFIG.parrygg, 4)],
  ]);
