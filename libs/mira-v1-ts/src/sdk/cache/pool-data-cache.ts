import {PoolId, PoolMetadata} from "../model";

/**
 * Extended pool metadata with caching information
 */
export interface CachedPoolMetadata extends PoolMetadata {
  fetchedAt: number; // Timestamp when data was fetched
  ttl: number; // Time to live in milliseconds
  refreshCount: number; // Number of times refreshed
  lastAccessedAt: number; // For LRU eviction
}

/**
 * Cache statistics for performance monitoring
 */
export interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  refreshes: number;
  totalRequests: number;
}

/**
 * Configuration options for the pool data cache
 */
export interface PoolCacheConfig {
  defaultTTL: number; // Default TTL in milliseconds (default: 30000)
  maxSize: number; // Maximum number of pools to cache (default: 100)
  enableLRU: boolean; // Enable LRU eviction (default: true)
  enableStats: boolean; // Enable statistics tracking (default: true)
}

/**
 * Default cache configuration
 */
export const DEFAULT_CACHE_CONFIG: PoolCacheConfig = {
  defaultTTL: 30000, // 30 seconds
  maxSize: 100,
  enableLRU: true,
  enableStats: true,
};

/**
 * Generates a consistent cache key for a pool ID
 */
export function generatePoolCacheKey(poolId: PoolId): string {
  return `${poolId[0].bits}-${poolId[1].bits}-${poolId[2]}`;
}

/**
 * Pool data cache with TTL-based expiration and LRU eviction
 */
export class PoolDataCache {
  private pools: Map<string, CachedPoolMetadata>;
  private accessOrder: string[]; // For LRU tracking
  private stats: CacheStats;
  private config: PoolCacheConfig;

  constructor(config: Partial<PoolCacheConfig> = {}) {
    console.count("PoolDataCache constructor");
    this.pools = new Map();
    this.accessOrder = [];
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      refreshes: 0,
      totalRequests: 0,
    };
    this.config = {...DEFAULT_CACHE_CONFIG, ...config};
  }

  /**
   * Get pool metadata from cache
   */
  getPoolMetadata(poolId: PoolId): CachedPoolMetadata | null {
    const key = generatePoolCacheKey(poolId);
    if (this.config.enableStats) {
      this.stats.totalRequests++;
    }

    const cached = this.pools.get(key);

    if (!cached) {
      if (this.config.enableStats) {
        this.stats.misses++;
      }
      return null;
    }

    // Check if data is expired
    if (this.isExpired(cached)) {
      this.pools.delete(key);
      this.removeFromAccessOrder(key);
      if (this.config.enableStats) {
        this.stats.misses++;
      }
      return null;
    }

    // Update access time and order for LRU
    if (this.config.enableLRU) {
      cached.lastAccessedAt = Date.now();
      this.updateAccessOrder(key);
    }

    if (this.config.enableStats) {
      this.stats.hits++;
    }

    return cached;
  }

  /**
   * Store pool metadata in cache
   */
  setPoolMetadata(poolId: PoolId, metadata: PoolMetadata, ttl?: number): void {
    const key = generatePoolCacheKey(poolId);
    const now = Date.now();
    const effectiveTTL = ttl ?? this.config.defaultTTL;

    const cachedMetadata: CachedPoolMetadata = {
      ...metadata,
      fetchedAt: now,
      ttl: effectiveTTL,
      refreshCount: this.pools.has(key)
        ? this.pools.get(key)!.refreshCount + 1
        : 0,
      lastAccessedAt: now,
    };

    // Check if we need to evict before adding
    if (!this.pools.has(key) && this.pools.size >= this.config.maxSize) {
      this.evictLRU();
    }

    this.pools.set(key, cachedMetadata);

    if (this.config.enableLRU) {
      this.updateAccessOrder(key);
    }

    if (this.config.enableStats && cachedMetadata.refreshCount > 0) {
      this.stats.refreshes++;
    }
  }

  /**
   * Check if cached data is stale (expired)
   */
  isStale(poolId: PoolId): boolean {
    const cached = this.pools.get(generatePoolCacheKey(poolId));
    return cached ? this.isExpired(cached) : true;
  }

  /**
   * Remove pool from cache
   */
  removePool(poolId: PoolId): boolean {
    const key = generatePoolCacheKey(poolId);
    const removed = this.pools.delete(key);
    if (removed) {
      this.removeFromAccessOrder(key);
    }
    return removed;
  }

  /**
   * Clear all cached data
   */
  clear(): void {
    this.pools.clear();
    this.accessOrder = [];
    if (this.config.enableStats) {
      this.stats = {
        hits: 0,
        misses: 0,
        evictions: 0,
        refreshes: 0,
        totalRequests: 0,
      };
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return {...this.stats};
  }

  /**
   * Get cache hit rate as percentage
   */
  getHitRate(): number {
    if (this.stats.totalRequests === 0) return 0;
    return (this.stats.hits / this.stats.totalRequests) * 100;
  }

  /**
   * Get current cache size
   */
  size(): number {
    return this.pools.size;
  }

  /**
   * Get all cached pool IDs
   */
  getCachedPoolIds(): string[] {
    return Array.from(this.pools.keys());
  }

  /**
   * Check if pool is cached and not expired
   */
  hasValidCache(poolId: PoolId): boolean {
    const cached = this.pools.get(generatePoolCacheKey(poolId));
    return cached ? !this.isExpired(cached) : false;
  }

  /**
   * Get cache configuration
   */
  getConfig(): PoolCacheConfig {
    return {...this.config};
  }

  /**
   * Update cache configuration
   */
  updateConfig(newConfig: Partial<PoolCacheConfig>): void {
    this.config = {...this.config, ...newConfig};
  }

  // Private helper methods

  private isExpired(cached: CachedPoolMetadata): boolean {
    return Date.now() - cached.fetchedAt > cached.ttl;
  }

  private evictLRU(): void {
    if (!this.config.enableLRU || this.accessOrder.length === 0) {
      // Fallback: remove first entry if LRU is disabled
      const firstKey = this.pools.keys().next().value;
      if (firstKey) {
        this.pools.delete(firstKey);
      }
      return;
    }

    // Remove least recently used item
    const lruKey = this.accessOrder[0];
    this.pools.delete(lruKey);
    this.accessOrder.shift();

    if (this.config.enableStats) {
      this.stats.evictions++;
    }
  }

  private updateAccessOrder(key: string): void {
    // Remove from current position
    this.removeFromAccessOrder(key);
    // Add to end (most recently used)
    this.accessOrder.push(key);
  }

  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }
}

/**
 * Singleton instance of the pool data cache
 * This ensures the cache persists across multiple ReadonlyMiraAmm instances
 */
export const globalPoolDataCache = new PoolDataCache();
