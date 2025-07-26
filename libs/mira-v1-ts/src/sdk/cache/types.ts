import {PoolId, PoolMetadata} from "../model";
import {CachedPoolMetadata} from "./pool-data-cache";

/**
 * Interface for pool data cache operations
 */
export interface IPoolDataCache {
  // Cache retrieval
  getPoolMetadata(poolId: PoolId): CachedPoolMetadata | null;

  // Cache storage
  setPoolMetadata(poolId: PoolId, metadata: PoolMetadata, ttl?: number): void;

  // Cache management
  isStale(poolId: PoolId): boolean;
  removePool(poolId: PoolId): boolean;
  clear(): void;

  // Cache status
  hasValidCache(poolId: PoolId): boolean;
  size(): number;
  getCachedPoolIds(): string[];
}

/**
 * Cache-specific error types
 */
export class CacheError extends Error {
  constructor(
    message: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = "CacheError";
  }
}

export class StaleDataError extends CacheError {
  constructor(poolId: PoolId, age: number) {
    super(
      `Pool data is stale: ${poolId[0].bits}-${poolId[1].bits}-${poolId[2]} (age: ${age}ms)`
    );
    this.name = "StaleDataError";
  }
}

export class PoolNotFoundError extends CacheError {
  constructor(poolId: PoolId) {
    super(
      `Pool not found in cache: ${poolId[0].bits}-${poolId[1].bits}-${poolId[2]}`
    );
    this.name = "PoolNotFoundError";
  }
}

/**
 * Cache options for controlling cache behavior
 */
export interface CacheOptions {
  useCache?: boolean; // Whether to use cache (default: true)
  preloadPools?: boolean; // Whether to preload pools (default: false)
  cacheTTL?: number; // Cache TTL in milliseconds (default: from config)
  refreshStaleData?: boolean; // Whether to refresh stale data (default: true)
}

/**
 * Default cache options
 */
export const DEFAULT_CACHE_OPTIONS: Required<CacheOptions> = {
  useCache: true,
  preloadPools: false,
  cacheTTL: 30000, // 30 seconds
  refreshStaleData: true,
};
