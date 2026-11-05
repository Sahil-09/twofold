import { Redis } from "ioredis";

declare global {
  // eslint-disable-next-line no-var
  var __twofoldRedis: Redis | undefined;
}

/**
 * Lazy, never-connects-at-import client. Returns null when REDIS_URL is unset so
 * the app keeps working (sessions in Mongo, no user cache) without Redis.
 */
export function redis(): Redis | null {
  const url = process.env.REDIS_URL;
  if (!url) return null;
  if (!globalThis.__twofoldRedis) {
    const client = new Redis(url, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false,
    });
    // Swallow connection errors; callers fall back to Mongo / uncached reads.
    client.on("error", () => {});
    globalThis.__twofoldRedis = client;
  }
  return globalThis.__twofoldRedis;
}