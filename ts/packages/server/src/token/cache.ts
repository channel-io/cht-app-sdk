import type { TokenCacheStorage, CachedToken } from "./types.js";

/**
 * In-memory token cache storage
 * Suitable for single-instance deployments
 * For multi-instance deployments, use Redis or database storage
 */
export class InMemoryTokenCache implements TokenCacheStorage {
  private cache = new Map<string, { token: CachedToken; expiresAt: number }>();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor(cleanupIntervalMs = 60000) {
    // Periodic cleanup of expired entries
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, cleanupIntervalMs);
  }

  get(key: string): Promise<CachedToken | null> {
    const entry = this.cache.get(key);
    if (!entry) return Promise.resolve(null);

    // Check if expired
    if (Date.now() >= entry.expiresAt) {
      this.cache.delete(key);
      return Promise.resolve(null);
    }

    return Promise.resolve(entry.token);
  }

  set(key: string, token: CachedToken, ttlMs?: number): Promise<void> {
    const expiresAt = ttlMs !== undefined ? Date.now() + ttlMs : token.expiresAt;
    this.cache.set(key, { token, expiresAt });
    return Promise.resolve();
  }

  delete(key: string): Promise<void> {
    this.cache.delete(key);
    return Promise.resolve();
  }

  clear(): Promise<void> {
    this.cache.clear();
    return Promise.resolve();
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now >= entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Stop the cleanup interval (call when shutting down)
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}
