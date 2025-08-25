import {
  PoolId,
  PoolMetadata,
  PoolIdV2,
  PoolMetadataV2,
  BinLiquidityInfo,
} from "../model";
import {CachedPoolMetadata} from "./pool-data-cache";

/**
 * Interface for pool data cache operations (v1)
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
 * Cached v2 pool metadata with timestamp
 */
export interface CachedPoolMetadataV2 {
  metadata: PoolMetadataV2;
  timestamp: number;
  ttl: number;
}

/**
 * Cached bin liquidity data
 */
export interface CachedBinData {
  binId: number;
  liquidity: BinLiquidityInfo;
  timestamp: number;
  ttl: number;
}

/**
 * Interface for v2 pool data cache operations
 */
export interface IPoolDataCacheV2 {
  // Pool metadata cache
  getPoolMetadata(poolId: PoolIdV2): CachedPoolMetadataV2 | null;
  setPoolMetadata(
    poolId: PoolIdV2,
    metadata: PoolMetadataV2,
    ttl?: number
  ): void;

  // Bin data cache
  getBinData(poolId: PoolIdV2, binId: number): CachedBinData | null;
  setBinData(
    poolId: PoolIdV2,
    binId: number,
    data: BinLiquidityInfo,
    ttl?: number
  ): void;
  getBinRange(
    poolId: PoolIdV2,
    startBinId: number,
    endBinId: number
  ): Map<number, CachedBinData>;

  // Fee cache (per-pool in v2)
  getPoolFee(poolId: PoolIdV2): number | null;
  setPoolFee(poolId: PoolIdV2, fee: number, ttl?: number): void;

  // Cache management
  isStale(poolId: PoolIdV2, binId?: number): boolean;
  removePool(poolId: PoolIdV2): boolean;
  removeBin(poolId: PoolIdV2, binId: number): boolean;
  clear(): void;

  // Cache status
  hasValidCache(poolId: PoolIdV2, binId?: number): boolean;
  size(): number;
  getCachedPoolIds(): string[];
  getCachedBinIds(poolId: PoolIdV2): number[];
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
  constructor(poolId: PoolId | PoolIdV2, age: number, binId?: number) {
    const poolIdStr = Array.isArray(poolId)
      ? `${poolId[0].bits}-${poolId[1].bits}-${poolId[2]}`
      : poolId.toString();
    const binIdStr = binId !== undefined ? ` bin:${binId}` : "";
    super(`Pool data is stale: ${poolIdStr}${binIdStr} (age: ${age}ms)`);
    this.name = "StaleDataError";
  }
}

export class PoolNotFoundError extends CacheError {
  constructor(poolId: PoolId | PoolIdV2, binId?: number) {
    const poolIdStr = Array.isArray(poolId)
      ? `${poolId[0].bits}-${poolId[1].bits}-${poolId[2]}`
      : poolId.toString();
    const binIdStr = binId !== undefined ? ` bin:${binId}` : "";
    super(`Pool not found in cache: ${poolIdStr}${binIdStr}`);
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
