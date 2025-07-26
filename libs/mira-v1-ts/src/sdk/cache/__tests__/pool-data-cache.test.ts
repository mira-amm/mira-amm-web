import {BN} from "fuels";
import {
  PoolDataCache,
  generatePoolCacheKey,
  DEFAULT_CACHE_CONFIG,
} from "../pool-data-cache";
import {PoolId, PoolMetadata} from "../../model";

// Mock pool data for testing
const createMockPoolId = (
  asset0: string,
  asset1: string,
  isStable: boolean = false
): PoolId => [{bits: asset0} as any, {bits: asset1} as any, isStable];

const createMockPoolMetadata = (
  poolId: PoolId,
  reserve0: number = 1000,
  reserve1: number = 2000
): PoolMetadata => ({
  poolId,
  reserve0: new BN(reserve0),
  reserve1: new BN(reserve1),
  liquidity: [{bits: "liquidity-asset"} as any, new BN(500)],
  decimals0: 9,
  decimals1: 9,
});

describe("PoolDataCache", () => {
  let cache: PoolDataCache;
  let mockPoolId: PoolId;
  let mockPoolMetadata: PoolMetadata;

  beforeEach(() => {
    cache = new PoolDataCache();
    mockPoolId = createMockPoolId("asset1", "asset2");
    mockPoolMetadata = createMockPoolMetadata(mockPoolId);
  });

  describe("generatePoolCacheKey", () => {
    it("should generate consistent cache keys", () => {
      const poolId = createMockPoolId("asset1", "asset2", false);
      const key1 = generatePoolCacheKey(poolId);
      const key2 = generatePoolCacheKey(poolId);

      expect(key1).toBe(key2);
      expect(key1).toBe("asset1-asset2-false");
    });

    it("should generate different keys for different pools", () => {
      const poolId1 = createMockPoolId("asset1", "asset2", false);
      const poolId2 = createMockPoolId("asset1", "asset2", true);
      const poolId3 = createMockPoolId("asset2", "asset1", false);

      const key1 = generatePoolCacheKey(poolId1);
      const key2 = generatePoolCacheKey(poolId2);
      const key3 = generatePoolCacheKey(poolId3);

      expect(key1).not.toBe(key2);
      expect(key1).not.toBe(key3);
      expect(key2).not.toBe(key3);
    });
  });

  describe("basic cache operations", () => {
    it("should store and retrieve pool metadata", () => {
      cache.setPoolMetadata(mockPoolId, mockPoolMetadata);
      const retrieved = cache.getPoolMetadata(mockPoolId);

      expect(retrieved).not.toBeNull();
      expect(retrieved!.poolId).toEqual(mockPoolMetadata.poolId);
      expect(retrieved!.reserve0).toEqual(mockPoolMetadata.reserve0);
      expect(retrieved!.reserve1).toEqual(mockPoolMetadata.reserve1);
    });

    it("should return null for non-existent pools", () => {
      const nonExistentPoolId = createMockPoolId(
        "nonexistent1",
        "nonexistent2"
      );
      const retrieved = cache.getPoolMetadata(nonExistentPoolId);

      expect(retrieved).toBeNull();
    });

    it("should track cache metadata correctly", () => {
      const beforeTime = Date.now();
      cache.setPoolMetadata(mockPoolId, mockPoolMetadata);
      const afterTime = Date.now();

      const retrieved = cache.getPoolMetadata(mockPoolId);

      expect(retrieved!.fetchedAt).toBeGreaterThanOrEqual(beforeTime);
      expect(retrieved!.fetchedAt).toBeLessThanOrEqual(afterTime);
      expect(retrieved!.ttl).toBe(DEFAULT_CACHE_CONFIG.defaultTTL);
      expect(retrieved!.refreshCount).toBe(0);
    });

    it("should increment refresh count on updates", () => {
      cache.setPoolMetadata(mockPoolId, mockPoolMetadata);
      cache.setPoolMetadata(mockPoolId, mockPoolMetadata);

      const retrieved = cache.getPoolMetadata(mockPoolId);
      expect(retrieved!.refreshCount).toBe(1);
    });
  });

  describe("TTL expiration", () => {
    it("should respect custom TTL", () => {
      const shortTTL = 100; // 100ms
      cache.setPoolMetadata(mockPoolId, mockPoolMetadata, shortTTL);

      const retrieved = cache.getPoolMetadata(mockPoolId);
      expect(retrieved!.ttl).toBe(shortTTL);
    });

    it("should return null for expired data", async () => {
      const shortTTL = 50; // 50ms
      cache.setPoolMetadata(mockPoolId, mockPoolMetadata, shortTTL);

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 60));

      const retrieved = cache.getPoolMetadata(mockPoolId);
      expect(retrieved).toBeNull();
    });

    it("should detect stale data correctly", async () => {
      const shortTTL = 50; // 50ms
      cache.setPoolMetadata(mockPoolId, mockPoolMetadata, shortTTL);

      expect(cache.isStale(mockPoolId)).toBe(false);

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 60));

      expect(cache.isStale(mockPoolId)).toBe(true);
    });
  });

  describe("LRU eviction", () => {
    it("should evict least recently used items when cache is full", () => {
      const smallCache = new PoolDataCache({maxSize: 2});

      const poolId1 = createMockPoolId("asset1", "asset2");
      const poolId2 = createMockPoolId("asset3", "asset4");
      const poolId3 = createMockPoolId("asset5", "asset6");

      const metadata1 = createMockPoolMetadata(poolId1);
      const metadata2 = createMockPoolMetadata(poolId2);
      const metadata3 = createMockPoolMetadata(poolId3);

      // Fill cache to capacity
      smallCache.setPoolMetadata(poolId1, metadata1);
      smallCache.setPoolMetadata(poolId2, metadata2);

      expect(smallCache.size()).toBe(2);
      expect(smallCache.getPoolMetadata(poolId1)).not.toBeNull();
      expect(smallCache.getPoolMetadata(poolId2)).not.toBeNull();

      // Add third item, should evict first
      smallCache.setPoolMetadata(poolId3, metadata3);

      expect(smallCache.size()).toBe(2);
      expect(smallCache.getPoolMetadata(poolId1)).toBeNull(); // Evicted
      expect(smallCache.getPoolMetadata(poolId2)).not.toBeNull();
      expect(smallCache.getPoolMetadata(poolId3)).not.toBeNull();
    });

    it("should update LRU order on access", () => {
      const smallCache = new PoolDataCache({maxSize: 2});

      const poolId1 = createMockPoolId("asset1", "asset2");
      const poolId2 = createMockPoolId("asset3", "asset4");
      const poolId3 = createMockPoolId("asset5", "asset6");

      const metadata1 = createMockPoolMetadata(poolId1);
      const metadata2 = createMockPoolMetadata(poolId2);
      const metadata3 = createMockPoolMetadata(poolId3);

      // Fill cache
      smallCache.setPoolMetadata(poolId1, metadata1);
      smallCache.setPoolMetadata(poolId2, metadata2);

      // Access first item to make it recently used
      smallCache.getPoolMetadata(poolId1);

      // Add third item, should evict second (not first)
      smallCache.setPoolMetadata(poolId3, metadata3);

      expect(smallCache.getPoolMetadata(poolId1)).not.toBeNull(); // Still there
      expect(smallCache.getPoolMetadata(poolId2)).toBeNull(); // Evicted
      expect(smallCache.getPoolMetadata(poolId3)).not.toBeNull();
    });
  });

  describe("cache statistics", () => {
    it("should track hits and misses", () => {
      cache.setPoolMetadata(mockPoolId, mockPoolMetadata);

      // Hit
      cache.getPoolMetadata(mockPoolId);

      // Miss
      const nonExistentPoolId = createMockPoolId(
        "nonexistent1",
        "nonexistent2"
      );
      cache.getPoolMetadata(nonExistentPoolId);

      const stats = cache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.totalRequests).toBe(2);
    });

    it("should calculate hit rate correctly", () => {
      cache.setPoolMetadata(mockPoolId, mockPoolMetadata);

      // 2 hits, 1 miss
      cache.getPoolMetadata(mockPoolId);
      cache.getPoolMetadata(mockPoolId);

      const nonExistentPoolId = createMockPoolId(
        "nonexistent1",
        "nonexistent2"
      );
      cache.getPoolMetadata(nonExistentPoolId);

      const hitRate = cache.getHitRate();
      expect(hitRate).toBeCloseTo(66.67, 1); // 2/3 * 100
    });

    it("should track evictions", () => {
      const smallCache = new PoolDataCache({maxSize: 1});

      const poolId1 = createMockPoolId("asset1", "asset2");
      const poolId2 = createMockPoolId("asset3", "asset4");

      const metadata1 = createMockPoolMetadata(poolId1);
      const metadata2 = createMockPoolMetadata(poolId2);

      smallCache.setPoolMetadata(poolId1, metadata1);
      smallCache.setPoolMetadata(poolId2, metadata2); // Should cause eviction

      const stats = smallCache.getStats();
      expect(stats.evictions).toBe(1);
    });

    it("should track refreshes", () => {
      cache.setPoolMetadata(mockPoolId, mockPoolMetadata);
      cache.setPoolMetadata(mockPoolId, mockPoolMetadata); // Refresh

      const stats = cache.getStats();
      expect(stats.refreshes).toBe(1);
    });
  });

  describe("cache management", () => {
    it("should remove specific pools", () => {
      cache.setPoolMetadata(mockPoolId, mockPoolMetadata);
      expect(cache.getPoolMetadata(mockPoolId)).not.toBeNull();

      const removed = cache.removePool(mockPoolId);
      expect(removed).toBe(true);
      expect(cache.getPoolMetadata(mockPoolId)).toBeNull();
    });

    it("should return false when removing non-existent pool", () => {
      const nonExistentPoolId = createMockPoolId(
        "nonexistent1",
        "nonexistent2"
      );
      const removed = cache.removePool(nonExistentPoolId);
      expect(removed).toBe(false);
    });

    it("should clear all cached data", () => {
      cache.setPoolMetadata(mockPoolId, mockPoolMetadata);
      expect(cache.size()).toBe(1);

      cache.clear();
      expect(cache.size()).toBe(0);

      // Check stats before calling getPoolMetadata to avoid incrementing counters
      const stats = cache.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.totalRequests).toBe(0);

      // Verify the pool is actually gone
      expect(cache.getPoolMetadata(mockPoolId)).toBeNull();
    });

    it("should check for valid cache correctly", () => {
      expect(cache.hasValidCache(mockPoolId)).toBe(false);

      cache.setPoolMetadata(mockPoolId, mockPoolMetadata);
      expect(cache.hasValidCache(mockPoolId)).toBe(true);
    });

    it("should return cached pool IDs", () => {
      const poolId1 = createMockPoolId("asset1", "asset2");
      const poolId2 = createMockPoolId("asset3", "asset4");

      cache.setPoolMetadata(poolId1, createMockPoolMetadata(poolId1));
      cache.setPoolMetadata(poolId2, createMockPoolMetadata(poolId2));

      const cachedIds = cache.getCachedPoolIds();
      expect(cachedIds).toHaveLength(2);
      expect(cachedIds).toContain(generatePoolCacheKey(poolId1));
      expect(cachedIds).toContain(generatePoolCacheKey(poolId2));
    });
  });

  describe("configuration", () => {
    it("should use custom configuration", () => {
      const customConfig = {
        defaultTTL: 60000,
        maxSize: 50,
        enableLRU: false,
        enableStats: false,
      };

      const customCache = new PoolDataCache(customConfig);
      const config = customCache.getConfig();

      expect(config.defaultTTL).toBe(60000);
      expect(config.maxSize).toBe(50);
      expect(config.enableLRU).toBe(false);
      expect(config.enableStats).toBe(false);
    });

    it("should update configuration", () => {
      cache.updateConfig({defaultTTL: 45000});
      const config = cache.getConfig();

      expect(config.defaultTTL).toBe(45000);
      expect(config.maxSize).toBe(DEFAULT_CACHE_CONFIG.maxSize); // Unchanged
    });

    it("should disable statistics when configured", () => {
      const noStatsCache = new PoolDataCache({enableStats: false});

      noStatsCache.setPoolMetadata(mockPoolId, mockPoolMetadata);
      noStatsCache.getPoolMetadata(mockPoolId);

      const stats = noStatsCache.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.totalRequests).toBe(0);
    });
  });
});
