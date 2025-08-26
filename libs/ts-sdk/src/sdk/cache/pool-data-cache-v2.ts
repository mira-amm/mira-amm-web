import {BN} from "fuels";
import {PoolIdV2, PoolMetadataV2, BinLiquidityInfo} from "../model";
import {IPoolDataCacheV2, CachedPoolMetadataV2, CachedBinData} from "./types";

/**
 * Extended pool metadata with caching information for v2
 */
export interface CachedPoolMetadataV2Extended extends CachedPoolMetadataV2 {
  fetchedAt: number; // Timestamp when data was fetched
  refreshCount: number; // Number of times refreshed
  lastAccessedAt: number; // For LRU eviction
}

/**
 * Extended bin data with caching information
 */
export interface CachedBinDataExtended extends CachedBinData {
  fetchedAt: number;
  refreshCount: number;
  lastAccessedAt: number;
}

/**
 * Cached fee data for v2 pools
 */
export interface CachedPoolFee {
  fee: number;
  timestamp: number;
  ttl: number;
  fetchedAt: number;
  refreshCount: number;
  lastAccessedAt: number;
}

/**
 * Cache statistics for v2 performance monitoring
 */
export interface CacheStatsV2 {
  poolMetadataHits: number;
  poolMetadataMisses: number;
  binDataHits: number;
  binDataMisses: number;
  feeHits: number;
  feeMisses: number;
  evictions: number;
  refreshes: number;
  totalRequests: number;
}

/**
 * Configuration options for the v2 pool data cache
 */
export interface PoolCacheConfigV2 {
  defaultTTL: number; // Default TTL in milliseconds (default: 30000)
  binDataTTL: number; // TTL for bin data (default: 15000)
  feeTTL: number; // TTL for fee data (default: 60000)
  maxPoolSize: number; // Maximum number of pools to cache (default: 100)
  maxBinsPerPool: number; // Maximum bins per pool to cache (default: 200)
  enableLRU: boolean; // Enable LRU eviction (default: true)
  enableStats: boolean; // Enable statistics tracking (default: true)
  preloadActiveBins: boolean; // Preload bins around active bin (default: true)
  preloadRange: number; // Number of bins to preload around active bin (default: 10)
}

/**
 * Default v2 cache configuration
 */
export const DEFAULT_CACHE_CONFIG_V2: PoolCacheConfigV2 = {
  defaultTTL: 30000, // 30 seconds
  binDataTTL: 15000, // 15 seconds (bins change more frequently)
  feeTTL: 60000, // 60 seconds (fees change less frequently)
  maxPoolSize: 100,
  maxBinsPerPool: 200,
  enableLRU: true,
  enableStats: true,
  preloadActiveBins: true,
  preloadRange: 10,
};

/**
 * Generates a consistent cache key for a v2 pool ID
 */
export function generatePoolCacheKeyV2(poolId: PoolIdV2): string {
  return `pool-v2-${poolId.toString()}`;
}

/**
 * Generates a consistent cache key for bin data
 */
export function generateBinCacheKey(poolId: PoolIdV2, binId: number): string {
  return `bin-${poolId.toString()}-${binId}`;
}

/**
 * Generates a consistent cache key for pool fees
 */
export function generateFeeCacheKey(poolId: PoolIdV2): string {
  return `fee-v2-${poolId.toString()}`;
}

/**
 * Pool data cache for v2 with bin-level caching and TTL-based expiration
 */
export class PoolDataCacheV2 implements IPoolDataCacheV2 {
  private pools: Map<string, CachedPoolMetadataV2Extended>;
  private bins: Map<string, CachedBinDataExtended>;
  private fees: Map<string, CachedPoolFee>;
  private poolAccessOrder: string[]; // For LRU tracking of pools
  private binAccessOrder: string[]; // For LRU tracking of bins
  private feeAccessOrder: string[]; // For LRU tracking of fees
  private stats: CacheStatsV2;
  private config: PoolCacheConfigV2;

  constructor(config: Partial<PoolCacheConfigV2> = {}) {
    this.pools = new Map();
    this.bins = new Map();
    this.fees = new Map();
    this.poolAccessOrder = [];
    this.binAccessOrder = [];
    this.feeAccessOrder = [];
    this.stats = {
      poolMetadataHits: 0,
      poolMetadataMisses: 0,
      binDataHits: 0,
      binDataMisses: 0,
      feeHits: 0,
      feeMisses: 0,
      evictions: 0,
      refreshes: 0,
      totalRequests: 0,
    };
    this.config = {...DEFAULT_CACHE_CONFIG_V2, ...config};
  }

  /**
   * Get pool metadata from cache
   */
  getPoolMetadata(poolId: PoolIdV2): CachedPoolMetadataV2 | null {
    const key = generatePoolCacheKeyV2(poolId);
    if (this.config.enableStats) {
      this.stats.totalRequests++;
    }

    const cached = this.pools.get(key);

    if (!cached) {
      if (this.config.enableStats) {
        this.stats.poolMetadataMisses++;
      }
      return null;
    }

    // Check if data is expired
    if (this.isExpiredPoolMetadata(cached)) {
      this.pools.delete(key);
      this.removeFromAccessOrder(key, this.poolAccessOrder);
      if (this.config.enableStats) {
        this.stats.poolMetadataMisses++;
      }
      return null;
    }

    // Update access time and order for LRU
    if (this.config.enableLRU) {
      cached.lastAccessedAt = Date.now();
      this.updateAccessOrder(key, this.poolAccessOrder);
    }

    if (this.config.enableStats) {
      this.stats.poolMetadataHits++;
    }

    return {
      metadata: cached.metadata,
      timestamp: cached.timestamp,
      ttl: cached.ttl,
    };
  }

  /**
   * Store pool metadata in cache
   */
  setPoolMetadata(
    poolId: PoolIdV2,
    metadata: PoolMetadataV2,
    ttl?: number
  ): void {
    const key = generatePoolCacheKeyV2(poolId);
    const now = Date.now();
    const effectiveTTL = ttl ?? this.config.defaultTTL;

    const cachedMetadata: CachedPoolMetadataV2Extended = {
      metadata,
      timestamp: now,
      ttl: effectiveTTL,
      fetchedAt: now,
      refreshCount: this.pools.has(key)
        ? this.pools.get(key)!.refreshCount + 1
        : 0,
      lastAccessedAt: now,
    };

    // Check if we need to evict before adding
    if (!this.pools.has(key) && this.pools.size >= this.config.maxPoolSize) {
      this.evictLRUPool();
    }

    this.pools.set(key, cachedMetadata);

    if (this.config.enableLRU) {
      this.updateAccessOrder(key, this.poolAccessOrder);
    }

    if (this.config.enableStats && cachedMetadata.refreshCount > 0) {
      this.stats.refreshes++;
    }
  }

  /**
   * Get bin data from cache
   */
  getBinData(poolId: PoolIdV2, binId: number): CachedBinData | null {
    const key = generateBinCacheKey(poolId, binId);
    if (this.config.enableStats) {
      this.stats.totalRequests++;
    }

    const cached = this.bins.get(key);

    if (!cached) {
      if (this.config.enableStats) {
        this.stats.binDataMisses++;
      }
      return null;
    }

    // Check if data is expired
    if (this.isExpiredBinData(cached)) {
      this.bins.delete(key);
      this.removeFromAccessOrder(key, this.binAccessOrder);
      if (this.config.enableStats) {
        this.stats.binDataMisses++;
      }
      return null;
    }

    // Update access time and order for LRU
    if (this.config.enableLRU) {
      cached.lastAccessedAt = Date.now();
      this.updateAccessOrder(key, this.binAccessOrder);
    }

    if (this.config.enableStats) {
      this.stats.binDataHits++;
    }

    return {
      binId: cached.binId,
      liquidity: cached.liquidity,
      timestamp: cached.timestamp,
      ttl: cached.ttl,
    };
  }

  /**
   * Store bin data in cache
   */
  setBinData(
    poolId: PoolIdV2,
    binId: number,
    data: BinLiquidityInfo,
    ttl?: number
  ): void {
    const key = generateBinCacheKey(poolId, binId);
    const now = Date.now();
    const effectiveTTL = ttl ?? this.config.binDataTTL;

    const cachedBinData: CachedBinDataExtended = {
      binId,
      liquidity: data,
      timestamp: now,
      ttl: effectiveTTL,
      fetchedAt: now,
      refreshCount: this.bins.has(key)
        ? this.bins.get(key)!.refreshCount + 1
        : 0,
      lastAccessedAt: now,
    };

    // Check if we need to evict bins for this pool
    const poolBinCount = this.getBinCountForPool(poolId);
    if (!this.bins.has(key) && poolBinCount >= this.config.maxBinsPerPool) {
      this.evictLRUBinForPool(poolId);
    }

    this.bins.set(key, cachedBinData);

    if (this.config.enableLRU) {
      this.updateAccessOrder(key, this.binAccessOrder);
    }

    if (this.config.enableStats && cachedBinData.refreshCount > 0) {
      this.stats.refreshes++;
    }
  }

  /**
   * Get bin data for a range of bins
   */
  getBinRange(
    poolId: PoolIdV2,
    startBinId: number,
    endBinId: number
  ): Map<number, CachedBinData> {
    const result = new Map<number, CachedBinData>();

    for (let binId = startBinId; binId <= endBinId; binId++) {
      const binData = this.getBinData(poolId, binId);
      if (binData) {
        result.set(binId, binData);
      }
    }

    return result;
  }

  /**
   * Get pool fee from cache
   */
  getPoolFee(poolId: PoolIdV2): number | null {
    const key = generateFeeCacheKey(poolId);
    if (this.config.enableStats) {
      this.stats.totalRequests++;
    }

    const cached = this.fees.get(key);

    if (!cached) {
      if (this.config.enableStats) {
        this.stats.feeMisses++;
      }
      return null;
    }

    // Check if data is expired
    if (this.isExpiredFee(cached)) {
      this.fees.delete(key);
      this.removeFromAccessOrder(key, this.feeAccessOrder);
      if (this.config.enableStats) {
        this.stats.feeMisses++;
      }
      return null;
    }

    // Update access time and order for LRU
    if (this.config.enableLRU) {
      cached.lastAccessedAt = Date.now();
      this.updateAccessOrder(key, this.feeAccessOrder);
    }

    if (this.config.enableStats) {
      this.stats.feeHits++;
    }

    return cached.fee;
  }

  /**
   * Store pool fee in cache
   */
  setPoolFee(poolId: PoolIdV2, fee: number, ttl?: number): void {
    const key = generateFeeCacheKey(poolId);
    const now = Date.now();
    const effectiveTTL = ttl ?? this.config.feeTTL;

    const cachedFee: CachedPoolFee = {
      fee,
      timestamp: now,
      ttl: effectiveTTL,
      fetchedAt: now,
      refreshCount: this.fees.has(key)
        ? this.fees.get(key)!.refreshCount + 1
        : 0,
      lastAccessedAt: now,
    };

    this.fees.set(key, cachedFee);

    if (this.config.enableLRU) {
      this.updateAccessOrder(key, this.feeAccessOrder);
    }

    if (this.config.enableStats && cachedFee.refreshCount > 0) {
      this.stats.refreshes++;
    }
  }

  /**
   * Check if cached data is stale (expired)
   */
  isStale(poolId: PoolIdV2, binId?: number): boolean {
    if (binId !== undefined) {
      const cached = this.bins.get(generateBinCacheKey(poolId, binId));
      return cached ? this.isExpiredBinData(cached) : true;
    } else {
      const cached = this.pools.get(generatePoolCacheKeyV2(poolId));
      return cached ? this.isExpiredPoolMetadata(cached) : true;
    }
  }

  /**
   * Remove pool from cache (including all its bins)
   */
  removePool(poolId: PoolIdV2): boolean {
    const poolKey = generatePoolCacheKeyV2(poolId);
    const poolRemoved = this.pools.delete(poolKey);

    if (poolRemoved) {
      this.removeFromAccessOrder(poolKey, this.poolAccessOrder);
    }

    // Remove all bins for this pool
    const poolIdStr = poolId.toString();
    const binsToRemove: string[] = [];

    for (const [key] of this.bins) {
      if (key.startsWith(`bin-${poolIdStr}-`)) {
        binsToRemove.push(key);
      }
    }

    for (const binKey of binsToRemove) {
      this.bins.delete(binKey);
      this.removeFromAccessOrder(binKey, this.binAccessOrder);
    }

    // Remove fee for this pool
    const feeKey = generateFeeCacheKey(poolId);
    const feeRemoved = this.fees.delete(feeKey);
    if (feeRemoved) {
      this.removeFromAccessOrder(feeKey, this.feeAccessOrder);
    }

    return poolRemoved;
  }

  /**
   * Remove specific bin from cache
   */
  removeBin(poolId: PoolIdV2, binId: number): boolean {
    const key = generateBinCacheKey(poolId, binId);
    const removed = this.bins.delete(key);
    if (removed) {
      this.removeFromAccessOrder(key, this.binAccessOrder);
    }
    return removed;
  }

  /**
   * Clear all cached data
   */
  clear(): void {
    this.pools.clear();
    this.bins.clear();
    this.fees.clear();
    this.poolAccessOrder = [];
    this.binAccessOrder = [];
    this.feeAccessOrder = [];

    if (this.config.enableStats) {
      this.stats = {
        poolMetadataHits: 0,
        poolMetadataMisses: 0,
        binDataHits: 0,
        binDataMisses: 0,
        feeHits: 0,
        feeMisses: 0,
        evictions: 0,
        refreshes: 0,
        totalRequests: 0,
      };
    }
  }

  /**
   * Check if pool is cached and not expired
   */
  hasValidCache(poolId: PoolIdV2, binId?: number): boolean {
    if (binId !== undefined) {
      const cached = this.bins.get(generateBinCacheKey(poolId, binId));
      return cached ? !this.isExpiredBinData(cached) : false;
    } else {
      const cached = this.pools.get(generatePoolCacheKeyV2(poolId));
      return cached ? !this.isExpiredPoolMetadata(cached) : false;
    }
  }

  /**
   * Get current cache size
   */
  size(): number {
    return this.pools.size + this.bins.size + this.fees.size;
  }

  /**
   * Get all cached pool IDs
   */
  getCachedPoolIds(): string[] {
    return Array.from(this.pools.keys()).map((key) =>
      key.replace("pool-v2-", "")
    );
  }

  /**
   * Get all cached bin IDs for a specific pool
   */
  getCachedBinIds(poolId: PoolIdV2): number[] {
    const poolIdStr = poolId.toString();
    const binIds: number[] = [];

    for (const [key] of this.bins) {
      if (key.startsWith(`bin-${poolIdStr}-`)) {
        const binId = parseInt(key.split("-").pop()!);
        binIds.push(binId);
      }
    }

    return binIds.sort((a, b) => a - b);
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStatsV2 {
    return {...this.stats};
  }

  /**
   * Get cache hit rate as percentage
   */
  getHitRate(): number {
    if (this.stats.totalRequests === 0) return 0;
    const totalHits =
      this.stats.poolMetadataHits + this.stats.binDataHits + this.stats.feeHits;
    return (totalHits / this.stats.totalRequests) * 100;
  }

  /**
   * Get cache configuration
   */
  getConfig(): PoolCacheConfigV2 {
    return {...this.config};
  }

  /**
   * Update cache configuration
   */
  updateConfig(newConfig: Partial<PoolCacheConfigV2>): void {
    this.config = {...this.config, ...newConfig};
  }

  // Private helper methods

  private isExpiredPoolMetadata(cached: CachedPoolMetadataV2Extended): boolean {
    return Date.now() - cached.fetchedAt > cached.ttl;
  }

  private isExpiredBinData(cached: CachedBinDataExtended): boolean {
    return Date.now() - cached.fetchedAt > cached.ttl;
  }

  private isExpiredFee(cached: CachedPoolFee): boolean {
    return Date.now() - cached.fetchedAt > cached.ttl;
  }

  private getBinCountForPool(poolId: PoolIdV2): number {
    const poolIdStr = poolId.toString();
    let count = 0;

    for (const [key] of this.bins) {
      if (key.startsWith(`bin-${poolIdStr}-`)) {
        count++;
      }
    }

    return count;
  }

  private evictLRUPool(): void {
    if (!this.config.enableLRU || this.poolAccessOrder.length === 0) {
      // Fallback: remove first entry if LRU is disabled
      const firstKey = this.pools.keys().next().value;
      if (firstKey) {
        this.pools.delete(firstKey);
      }
      return;
    }

    // Remove least recently used pool
    const lruKey = this.poolAccessOrder[0];
    this.pools.delete(lruKey);
    this.poolAccessOrder.shift();

    if (this.config.enableStats) {
      this.stats.evictions++;
    }
  }

  private evictLRUBinForPool(poolId: PoolIdV2): void {
    const poolIdStr = poolId.toString();

    if (!this.config.enableLRU) {
      // Fallback: remove first bin for this pool
      for (const [key] of this.bins) {
        if (key.startsWith(`bin-${poolIdStr}-`)) {
          this.bins.delete(key);
          break;
        }
      }
      return;
    }

    // Find LRU bin for this pool
    for (const key of this.binAccessOrder) {
      if (key.startsWith(`bin-${poolIdStr}-`)) {
        this.bins.delete(key);
        this.removeFromAccessOrder(key, this.binAccessOrder);
        if (this.config.enableStats) {
          this.stats.evictions++;
        }
        break;
      }
    }
  }

  private updateAccessOrder(key: string, accessOrder: string[]): void {
    // Remove from current position
    this.removeFromAccessOrder(key, accessOrder);
    // Add to end (most recently used)
    accessOrder.push(key);
  }

  private removeFromAccessOrder(key: string, accessOrder: string[]): void {
    const index = accessOrder.indexOf(key);
    if (index > -1) {
      accessOrder.splice(index, 1);
    }
  }
}

/**
 * Singleton instance of the v2 pool data cache
 * This ensures the cache persists across multiple ReadonlyMiraAmmV2 instances
 */
export const globalPoolDataCacheV2 = new PoolDataCacheV2();
