import type { Request, Response, NextFunction } from "express";

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

const buckets = new Map<string, TokenBucket>();
const MAX_TOKENS = 20;
const REFILL_INTERVAL_MS = 60000;

function getClientKey(req: Request): string {
  return (
    (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ??
    req.socket.remoteAddress ??
    "unknown"
  );
}

export function rateLimiter(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const key = getClientKey(req);
  const now = Date.now();

  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { tokens: MAX_TOKENS, lastRefill: now };
    buckets.set(key, bucket);
  }

  // Refill tokens based on elapsed time
  const elapsed = now - bucket.lastRefill;
  const refill = Math.floor((elapsed / REFILL_INTERVAL_MS) * MAX_TOKENS);
  if (refill > 0) {
    bucket.tokens = Math.min(MAX_TOKENS, bucket.tokens + refill);
    bucket.lastRefill = now;
  }

  if (bucket.tokens <= 0) {
    res.status(429).json({ error: "Rate limit exceeded" });
    return;
  }

  bucket.tokens--;
  next();
}
