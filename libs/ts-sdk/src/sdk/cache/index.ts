// v1 cache exports
export {
  globalPoolDataCache,
  DEFAULT_CACHE_CONFIG,
  generatePoolCacheKey,
} from "./pool-data-cache";

export type {
  CacheStats,
  PoolDataCache,
  CachedPoolMetadata,
  PoolCacheConfig,
} from "./pool-data-cache";

// v2 cache exports
export {
  globalPoolDataCacheV2,
  PoolDataCacheV2,
  DEFAULT_CACHE_CONFIG_V2,
  generatePoolCacheKeyV2,
  generateBinCacheKey,
  generateFeeCacheKey,
} from "./pool-data-cache-v2";

export type {
  CacheStatsV2,
  PoolCacheConfigV2,
  CachedPoolMetadataV2Extended,
  CachedBinDataExtended,
  CachedPoolFee,
} from "./pool-data-cache-v2";

// v2 cache manager
export {CacheManagerV2} from "./cache-manager-v2";

export type {
  CacheStrategy,
  CacheWarmingConfig,
  CachePerformanceMetrics,
} from "./cache-manager-v2";

export type {
  IPoolDataCache,
  IPoolDataCacheV2,
  CacheOptions,
  CachedPoolMetadataV2,
  CachedBinData,
} from "./types";

export {CacheError, StaleDataError, PoolNotFoundError} from "./types";

export {DEFAULT_CACHE_OPTIONS} from "./types";
