export type RateLimit = {
  maxRequests: number;
  windowMs: number; // max requests per windowMs
};
