/**
 * Smart Cache Utility - UPGRADED Build
 * Caches resume analyses and job scoring for 1 hour
 * Reduces database queries and AI API calls
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  hits: number;
}

const cache = new Map<string, CacheEntry<any>>();

// Auto-cleanup expired entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  const keysToDelete: string[] = [];

  cache.forEach((entry, key) => {
    if (entry.expiresAt < now) {
      keysToDelete.push(key);
    }
  });

  keysToDelete.forEach((key) => cache.delete(key));

  if (keysToDelete.length > 0) {
    console.log(`[Cache] Cleaned ${keysToDelete.length} expired entries`);
  }
}, 10 * 60 * 1000);

/**
 * Generate cache key from parameters
 */
function generateKey(prefix: string, params: Record<string, any>): string {
  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${k}=${JSON.stringify(params[k])}`)
    .join('&');
  return `${prefix}:${Buffer.from(sorted).toString('base64')}`;
}

/**
 * Get from cache
 */
export function getFromCache<T>(prefix: string, params: Record<string, any>): T | null {
  const key = generateKey(prefix, params);
  const entry = cache.get(key);

  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    cache.delete(key);
    return null;
  }

  entry.hits++;
  return entry.data as T;
}

/**
 * Set in cache
 */
export function setInCache<T>(
  prefix: string,
  params: Record<string, any>,
  data: T,
  ttlMinutes: number = 60
): void {
  const key = generateKey(prefix, params);
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttlMinutes * 60 * 1000,
    hits: 0,
  });
}

/**
 * Clear specific cache prefix
 */
export function clearCache(prefix: string): void {
  let cleared = 0;
  cache.forEach((_, key) => {
    if (key.startsWith(prefix)) {
      cache.delete(key);
      cleared++;
    }
  });
  console.log(`[Cache] Cleared ${cleared} entries for prefix: ${prefix}`);
}

/**
 * Get cache stats
 */
export function getCacheStats() {
  let totalHits = 0;
  cache.forEach((entry) => {
    totalHits += entry.hits;
  });

  return {
    size: cache.size,
    hits: totalHits,
    memoryUsage: `${Math.round((JSON.stringify(Array.from(cache.values())).length / 1024) * 100) / 100}KB`,
  };
}
