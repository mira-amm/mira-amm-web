import {BN} from "fuels";
import {PoolIdV2} from "../model";
import {PoolDataCacheV2} from "./pool-data-cache-v2";
import {ReadonlyMiraAmmV2} from "../readonly_mira_amm_v2";

/**
 * Cache management strategies for v2 pools
 */
export enum CacheStrategy {
  AGGRESSIVE = "aggressive", // Short TTLs, frequent refreshes
  BALANCED = "balanced", // Default balanced approach
  CONSERVATIVE = "conservative", // Long TTLs, less frequent refreshes
  CUSTOM = "custom", // User-defined configuration
}

/**
 * Cache warming configuration
 */
export interface CacheWarmingConfig {
  enabled: boolean;
  poolIds: PoolIdV2[];
  intervalMs: number; // How often to refresh in milliseconds
  preloadBinRange: number; // Number of bins around active bin to preload
}

/**
 * Cache performance metrics
 */
export interface CachePerformanceMetrics {
  hitRate: number;
  missRate: number;
  evictionRate: number;
  averageResponseTime: number;
  cacheSize: number;
  memoryUsage: number; // Estimated memory usage in bytes
}

/**
 * Advanced cache manager for v2 pools with intelligent strategies
 */
export class CacheManagerV2 {
  private cache: PoolDataCacheV2;
  private readonlyAmm: ReadonlyMiraAmmV2;
  private warmingInterval: NodeJS.Timeout | null = null;
  private performanceMetrics: Map<string, number[]> = new Map();
  private lastMetricsReset: number = Date.now();

  constructor(cache: PoolDataCacheV2, readonlyAmm: ReadonlyMiraAmmV2) {
    this.cache = cache;
    this.readonlyAmm = readonlyAmm;
  }

  /**
   * Apply a caching strategy
   */
  applyStrategy(strategy: CacheStrategy): void {
    const config = this.cache.getConfig();

    switch (strategy) {
      case CacheStrategy.AGGRESSIVE:
        this.cache.updateConfig({
          ...config,
          defaultTTL: 10000, // 10 seconds
          binDataTTL: 5000, // 5 seconds
          feeTTL: 20000, // 20 seconds
          maxPoolSize: 200,
          maxBinsPerPool: 500,
          preloadActiveBins: true,
          preloadRange: 15,
        });
        break;

      case CacheStrategy.BALANCED:
        this.cache.updateConfig({
          ...config,
          defaultTTL: 30000, // 30 seconds
          binDataTTL: 15000, // 15 seconds
          feeTTL: 60000, // 60 seconds
          maxPoolSize: 100,
          maxBinsPerPool: 200,
          preloadActiveBins: true,
          preloadRange: 10,
        });
        break;

      case CacheStrategy.CONSERVATIVE:
        this.cache.updateConfig({
          ...config,
          defaultTTL: 120000, // 2 minutes
          binDataTTL: 60000, // 1 minute
          feeTTL: 300000, // 5 minutes
          maxPoolSize: 50,
          maxBinsPerPool: 100,
          preloadActiveBins: false,
          preloadRange: 5,
        });
        break;

      case CacheStrategy.CUSTOM:
        // Custom strategy should be configured manually
        break;
    }
  }

  /**
   * Start cache warming for frequently used pools
   */
  startCacheWarming(config: CacheWarmingConfig): void {
    if (!config.enabled) {
      return;
    }

    this.stopCacheWarming(); // Stop any existing warming

    this.warmingInterval = setInterval(async () => {
      try {
        await this.warmCache(config);
      } catch (error) {
        console.warn("Cache warming failed:", error);
      }
    }, config.intervalMs);

    // Initial warming
    this.warmCache(config).catch((error) => {
      console.warn("Initial cache warming failed:", error);
    });
  }

  /**
   * Stop cache warming
   */
  stopCacheWarming(): void {
    if (this.warmingInterval) {
      clearInterval(this.warmingInterval);
      this.warmingInterval = null;
    }
  }

  /**
   * Warm cache for specific pools
   */
  private async warmCache(config: CacheWarmingConfig): Promise<void> {
    const startTime = Date.now();

    // Warm pool metadata
    await this.readonlyAmm.poolMetadataBatch(config.poolIds, {
      useCache: true,
      refreshStaleData: true,
    });

    // Warm fees
    const feePromises = config.poolIds.map((poolId) =>
      this.readonlyAmm.fees(poolId).catch(() => {
        // Ignore individual failures
      })
    );
    await Promise.allSettled(feePromises);

    // Warm bin data around active bins
    if (config.preloadBinRange > 0) {
      for (const poolId of config.poolIds) {
        try {
          const activeBinId = await this.readonlyAmm.getActiveBin(poolId);
          if (activeBinId !== null) {
            const binPromises: Promise<void>[] = [];
            const start = activeBinId - config.preloadBinRange;
            const end = activeBinId + config.preloadBinRange;

            for (let binId = start; binId <= end; binId++) {
              binPromises.push(
                this.readonlyAmm
                  .getBinLiquidity(poolId, binId)
                  .then(() => {})
                  .catch(() => {})
              );
            }

            await Promise.allSettled(binPromises);
          }
        } catch (error) {
          // Continue with other pools
        }
      }
    }

    const duration = Date.now() - startTime;
    this.recordMetric("warmingDuration", duration);
  }

  /**
   * Get comprehensive performance metrics
   */
  getPerformanceMetrics(): CachePerformanceMetrics {
    const stats = this.cache.getStats();
    const totalRequests = stats.totalRequests;
    const totalHits =
      stats.poolMetadataHits + stats.binDataHits + stats.feeHits;
    const totalMisses =
      stats.poolMetadataMisses + stats.binDataMisses + stats.feeMisses;

    const hitRate = totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0;
    const missRate =
      totalRequests > 0 ? (totalMisses / totalRequests) * 100 : 0;
    const evictionRate =
      totalRequests > 0 ? (stats.evictions / totalRequests) * 100 : 0;

    // Calculate average response time from recorded metrics
    const responseTimes = this.performanceMetrics.get("responseTime") || [];
    const averageResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0;

    // Estimate memory usage (rough calculation)
    const cacheSize = this.cache.size();
    const estimatedMemoryPerEntry = 1024; // 1KB per entry (rough estimate)
    const memoryUsage = cacheSize * estimatedMemoryPerEntry;

    return {
      hitRate,
      missRate,
      evictionRate,
      averageResponseTime,
      cacheSize,
      memoryUsage,
    };
  }

  /**
   * Record a performance metric
   */
  recordMetric(name: string, value: number): void {
    if (!this.performanceMetrics.has(name)) {
      this.performanceMetrics.set(name, []);
    }

    const metrics = this.performanceMetrics.get(name)!;
    metrics.push(value);

    // Keep only last 100 measurements to prevent memory growth
    if (metrics.length > 100) {
      metrics.shift();
    }
  }

  /**
   * Reset performance metrics
   */
  resetMetrics(): void {
    this.performanceMetrics.clear();
    this.lastMetricsReset = Date.now();
  }

  /**
   * Optimize cache configuration based on usage patterns
   */
  optimizeConfiguration(): void {
    const metrics = this.getPerformanceMetrics();
    const config = this.cache.getConfig();

    // If hit rate is low, increase cache size and TTLs
    if (metrics.hitRate < 50) {
      this.cache.updateConfig({
        ...config,
        maxPoolSize: Math.min(config.maxPoolSize * 1.5, 500),
        maxBinsPerPool: Math.min(config.maxBinsPerPool * 1.5, 1000),
        defaultTTL: Math.min(config.defaultTTL * 1.2, 300000), // Max 5 minutes
        binDataTTL: Math.min(config.binDataTTL * 1.2, 180000), // Max 3 minutes
      });
    }

    // If eviction rate is high, increase cache size
    if (metrics.evictionRate > 10) {
      this.cache.updateConfig({
        ...config,
        maxPoolSize: Math.min(config.maxPoolSize * 1.3, 500),
        maxBinsPerPool: Math.min(config.maxBinsPerPool * 1.3, 1000),
      });
    }

    // If memory usage is too high, reduce cache size
    if (metrics.memoryUsage > 50 * 1024 * 1024) {
      // 50MB
      this.cache.updateConfig({
        ...config,
        maxPoolSize: Math.max(config.maxPoolSize * 0.8, 50),
        maxBinsPerPool: Math.max(config.maxBinsPerPool * 0.8, 100),
      });
    }
  }

  /**
   * Preload cache for a specific trading route
   */
  async preloadRoute(
    assetIn: string,
    assetOut: string,
    pools: PoolIdV2[]
  ): Promise<void> {
    const startTime = Date.now();

    try {
      // Preload pool metadata
      await this.readonlyAmm.poolMetadataBatch(pools, {
        useCache: true,
        refreshStaleData: false,
      });

      // Preload fees
      const feePromises = pools.map((poolId) => this.readonlyAmm.fees(poolId));
      await Promise.allSettled(feePromises);

      // Preload active bins and surrounding bins
      const config = this.cache.getConfig();
      if (config.preloadActiveBins) {
        for (const poolId of pools) {
          try {
            const activeBinId = await this.readonlyAmm.getActiveBin(poolId);
            if (activeBinId !== null) {
              const binPromises: Promise<void>[] = [];
              const start = activeBinId - config.preloadRange;
              const end = activeBinId + config.preloadRange;

              for (let binId = start; binId <= end; binId++) {
                binPromises.push(
                  this.readonlyAmm
                    .getBinLiquidity(poolId, binId)
                    .then(() => {})
                    .catch(() => {})
                );
              }

              await Promise.allSettled(binPromises);
            }
          } catch (error) {
            // Continue with other pools
          }
        }
      }

      const duration = Date.now() - startTime;
      this.recordMetric("routePreloadDuration", duration);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.recordMetric("routePreloadError", duration);
      throw error;
    }
  }

  /**
   * Clear cache for stale or outdated data
   */
  clearStaleData(): void {
    const poolIds = this.cache.getCachedPoolIds();

    for (const poolIdStr of poolIds) {
      const poolId = new BN(poolIdStr);

      // Check if pool metadata is stale
      if (this.cache.isStale(poolId)) {
        this.cache.removePool(poolId);
        continue;
      }

      // Check bins for this pool
      const binIds = this.cache.getCachedBinIds(poolId);
      for (const binId of binIds) {
        if (this.cache.isStale(poolId, binId)) {
          this.cache.removeBin(poolId, binId);
        }
      }
    }
  }

  /**
   * Get cache status summary
   */
  getCacheStatus(): {
    strategy: string;
    isWarming: boolean;
    metrics: CachePerformanceMetrics;
    config: any;
  } {
    return {
      strategy: "unknown", // Would need to track applied strategy
      isWarming: this.warmingInterval !== null,
      metrics: this.getPerformanceMetrics(),
      config: this.cache.getConfig(),
    };
  }
}
