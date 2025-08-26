import {describe, it, expect, beforeEach, vi} from "vitest";
import {BN} from "fuels";
import {
  PoolDataCacheV2,
  DEFAULT_CACHE_CONFIG_V2,
  generatePoolCacheKeyV2,
  generateBinCacheKey,
  generateFeeCacheKey,
} from "../pool-data-cache-v2";
import {PoolIdV2, PoolMetadataV2, BinLiquidityInfo} from "../../model";

// Mock data helpers
function createMockPoolIdV2(id: string): PoolIdV2 {
  return new BN(id);
}

function createMockPoolMetadataV2(poolId: PoolIdV2): PoolMetadataV2 {
  return {
    poolId,
    pool: {
      assetX: {bits: "0x1234"},
      assetY: {bits: "0x5678"},
      binStep: 100,
      baseFactor: 5000,
    },
    activeId: 8388608, // 2^23 (neutral bin)
    reserves: {
      x: new BN(1000000),
      y: new BN(2000000),
    },
    protocolFees: {
      x: new BN(1000),
      y: new BN(2000),
    },
  };
}

function createMockBinLiquidityInfo(binId: number): BinLiquidityInfo {
  return {
    binId,
    liquidity: {
      x: new BN(100000),
      y: new BN(200000),
    },
    price: new BN(1000000),
  };
}

describe("PoolDataCacheV2", () => {
  let cache: PoolDataCacheV2;
  let mockPoolId: PoolIdV2;
  let mockPoolMetadata: PoolMetadataV2;
  let mockBinLiquidity: BinLiquidityInfo;

  beforeEach(() => {
    cache = new PoolDataCacheV2();
    mockPoolId = createMockPoolIdV2("12345");
    mockPoolMetadata = createMockPoolMetadataV2(mockPoolId);
    mockBinLiquidity = createMockBinLiquidityInfo(8388608);
  });

  describe("Pool Metadata Caching", () => {
    it("should store and retrieve pool metadata", () => {
      cache.setPoolMetadata(mockPoolId, mockPoolMetadata);
      const cached = cache.getPoolMetadata(mockPoolId);

      expect(cached).toBeTruthy();
      expect(cached!.metadata).toEqual(mockPoolMetadata);
    });

    it("should return null for non-existent pool", () => {
      const nonExistentPoolId = createMockPoolIdV2("99999");
      const cached = cache.getPoolMetadata(nonExistentPoolId);

      expect(cached).toBeNull();
    });

    it("should handle TTL expiration for pool metadata", async () => {
      const shortTTL = 10; // 10ms
      cache.setPoolMetadata(mockPoolId, mockPoolMetadata, shortTTL);

      // Should be available immediately
      let cached = cache.getPoolMetadata(mockPoolId);
      expect(cached).toBeTruthy();

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 20));

      // Should be expired now
      cached = cache.getPoolMetadata(mockPoolId);
      expect(cached).toBeNull();
    });
  });

  describe("Bin Data Caching", () => {
    it("should store and retrieve bin data", () => {
      const binId = 8388608;
      cache.setBinData(mockPoolId, binId, mockBinLiquidity);
      const cached = cache.getBinData(mockPoolId, binId);

      expect(cached).toBeTruthy();
      expect(cached!.liquidity).toEqual(mockBinLiquidity);
    });

    it("should return null for non-existent bin", () => {
      const cached = cache.getBinData(mockPoolId, 99999);
      expect(cached).toBeNull();
    });

    it("should handle TTL expiration for bin data", async () => {
      const shortTTL = 10; // 10ms
      const binId = 8388608;
      cache.setBinData(mockPoolId, binId, mockBinLiquidity, shortTTL);

      // Should be available immediately
      let cached = cache.getBinData(mockPoolId, binId);
      expect(cached).toBeTruthy();

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 20));

      // Should be expired now
      cached = cache.getBinData(mockPoolId, binId);
      expect(cached).toBeNull();
    });

    it("should retrieve bin range data", () => {
      const startBin = 8388600;
      const endBin = 8388610;

      // Add some bin data
      for (let binId = startBin; binId <= endBin; binId++) {
        const binData = createMockBinLiquidityInfo(binId);
        cache.setBinData(mockPoolId, binId, binData);
      }

      const rangeData = cache.getBinRange(mockPoolId, startBin, endBin);
      expect(rangeData.size).toBe(endBin - startBin + 1);

      for (let binId = startBin; binId <= endBin; binId++) {
        expect(rangeData.has(binId)).toBe(true);
      }
    });
  });

  describe("Fee Caching", () => {
    it("should store and retrieve pool fees", () => {
      const fee = 3000; // 0.3%
      cache.setPoolFee(mockPoolId, fee);
      const cached = cache.getPoolFee(mockPoolId);

      expect(cached).toBe(fee);
    });

    it("should return null for non-existent pool fee", () => {
      const nonExistentPoolId = createMockPoolIdV2("99999");
      const cached = cache.getPoolFee(nonExistentPoolId);

      expect(cached).toBeNull();
    });

    it("should handle TTL expiration for fees", async () => {
      const shortTTL = 10; // 10ms
      const fee = 3000;
      cache.setPoolFee(mockPoolId, fee, shortTTL);

      // Should be available immediately
      let cached = cache.getPoolFee(mockPoolId);
      expect(cached).toBe(fee);

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 20));

      // Should be expired now
      cached = cache.getPoolFee(mockPoolId);
      expect(cached).toBeNull();
    });
  });

  describe("Cache Management", () => {
    it("should check staleness correctly", async () => {
      cache.setPoolMetadata(mockPoolId, mockPoolMetadata, 10); // 10ms TTL

      // Should not be stale immediately
      expect(cache.isStale(mockPoolId)).toBe(false);

      // Should be stale after TTL
      await new Promise((resolve) => setTimeout(resolve, 20));
      expect(cache.isStale(mockPoolId)).toBe(true);
    });

    it("should remove pool and all associated data", () => {
      const binId = 8388608;

      // Add pool metadata, bin data, and fee
      cache.setPoolMetadata(mockPoolId, mockPoolMetadata);
      cache.setBinData(mockPoolId, binId, mockBinLiquidity);
      cache.setPoolFee(mockPoolId, 3000);

      // Verify data exists
      expect(cache.getPoolMetadata(mockPoolId)).toBeTruthy();
      expect(cache.getBinData(mockPoolId, binId)).toBeTruthy();
      expect(cache.getPoolFee(mockPoolId)).toBeTruthy();

      // Remove pool
      const removed = cache.removePool(mockPoolId);
      expect(removed).toBe(true);

      // Verify all data is removed
      expect(cache.getPoolMetadata(mockPoolId)).toBeNull();
      expect(cache.getBinData(mockPoolId, binId)).toBeNull();
      expect(cache.getPoolFee(mockPoolId)).toBeNull();
    });

    it("should remove specific bin data", () => {
      const binId = 8388608;
      cache.setBinData(mockPoolId, binId, mockBinLiquidity);

      // Verify bin exists
      expect(cache.getBinData(mockPoolId, binId)).toBeTruthy();

      // Remove bin
      const removed = cache.removeBin(mockPoolId, binId);
      expect(removed).toBe(true);

      // Verify bin is removed
      expect(cache.getBinData(mockPoolId, binId)).toBeNull();
    });

    it("should clear all cache data", () => {
      const binId = 8388608;

      // Add various data
      cache.setPoolMetadata(mockPoolId, mockPoolMetadata);
      cache.setBinData(mockPoolId, binId, mockBinLiquidity);
      cache.setPoolFee(mockPoolId, 3000);

      expect(cache.size()).toBeGreaterThan(0);

      // Clear cache
      cache.clear();

      expect(cache.size()).toBe(0);
      expect(cache.getPoolMetadata(mockPoolId)).toBeNull();
      expect(cache.getBinData(mockPoolId, binId)).toBeNull();
      expect(cache.getPoolFee(mockPoolId)).toBeNull();
    });
  });

  describe("LRU Eviction", () => {
    it("should evict least recently used pools when cache is full", () => {
      const smallCache = new PoolDataCacheV2({maxPoolSize: 2});

      const poolId1 = createMockPoolIdV2("1");
      const poolId2 = createMockPoolIdV2("2");
      const poolId3 = createMockPoolIdV2("3");

      const metadata1 = createMockPoolMetadataV2(poolId1);
      const metadata2 = createMockPoolMetadataV2(poolId2);
      const metadata3 = createMockPoolMetadataV2(poolId3);

      // Add two pools (should fit)
      smallCache.setPoolMetadata(poolId1, metadata1);
      smallCache.setPoolMetadata(poolId2, metadata2);

      expect(smallCache.getPoolMetadata(poolId1)).toBeTruthy();
      expect(smallCache.getPoolMetadata(poolId2)).toBeTruthy();

      // Add third pool (should evict first)
      smallCache.setPoolMetadata(poolId3, metadata3);

      expect(smallCache.getPoolMetadata(poolId1)).toBeNull(); // Evicted
      expect(smallCache.getPoolMetadata(poolId2)).toBeTruthy();
      expect(smallCache.getPoolMetadata(poolId3)).toBeTruthy();
    });

    it("should evict least recently used bins when bin limit is reached", () => {
      const smallCache = new PoolDataCacheV2({maxBinsPerPool: 2});

      const binId1 = 8388600;
      const binId2 = 8388601;
      const binId3 = 8388602;

      const binData1 = createMockBinLiquidityInfo(binId1);
      const binData2 = createMockBinLiquidityInfo(binId2);
      const binData3 = createMockBinLiquidityInfo(binId3);

      // Add two bins (should fit)
      smallCache.setBinData(mockPoolId, binId1, binData1);
      smallCache.setBinData(mockPoolId, binId2, binData2);

      expect(smallCache.getBinData(mockPoolId, binId1)).toBeTruthy();
      expect(smallCache.getBinData(mockPoolId, binId2)).toBeTruthy();

      // Add third bin (should evict first)
      smallCache.setBinData(mockPoolId, binId3, binData3);

      expect(smallCache.getBinData(mockPoolId, binId1)).toBeNull(); // Evicted
      expect(smallCache.getBinData(mockPoolId, binId2)).toBeTruthy();
      expect(smallCache.getBinData(mockPoolId, binId3)).toBeTruthy();
    });
  });

  describe("Statistics", () => {
    it("should track cache statistics", () => {
      // Enable stats
      const statsCache = new PoolDataCacheV2({enableStats: true});

      // Add some data
      statsCache.setPoolMetadata(mockPoolId, mockPoolMetadata);

      // Hit
      statsCache.getPoolMetadata(mockPoolId);

      // Miss
      const nonExistentPoolId = createMockPoolIdV2("99999");
      statsCache.getPoolMetadata(nonExistentPoolId);

      const stats = statsCache.getStats();
      expect(stats.poolMetadataHits).toBe(1);
      expect(stats.poolMetadataMisses).toBe(1);
      expect(stats.totalRequests).toBe(2);
    });

    it("should calculate hit rate correctly", () => {
      const statsCache = new PoolDataCacheV2({enableStats: true});

      // Add data and create hits/misses
      statsCache.setPoolMetadata(mockPoolId, mockPoolMetadata);

      // 2 hits
      statsCache.getPoolMetadata(mockPoolId);
      statsCache.getPoolMetadata(mockPoolId);

      // 1 miss
      const nonExistentPoolId = createMockPoolIdV2("99999");
      statsCache.getPoolMetadata(nonExistentPoolId);

      const hitRate = statsCache.getHitRate();
      expect(hitRate).toBeCloseTo(66.67, 1); // 2/3 * 100
    });
  });

  describe("Configuration", () => {
    it("should use default configuration", () => {
      const defaultCache = new PoolDataCacheV2();
      const config = defaultCache.getConfig();

      expect(config).toEqual(DEFAULT_CACHE_CONFIG_V2);
    });

    it("should allow custom configuration", () => {
      const customConfig = {
        defaultTTL: 60000,
        maxPoolSize: 200,
        enableStats: false,
      };

      const customCache = new PoolDataCacheV2(customConfig);
      const config = customCache.getConfig();

      expect(config.defaultTTL).toBe(60000);
      expect(config.maxPoolSize).toBe(200);
      expect(config.enableStats).toBe(false);
    });

    it("should update configuration", () => {
      cache.updateConfig({defaultTTL: 45000});
      const config = cache.getConfig();

      expect(config.defaultTTL).toBe(45000);
    });
  });

  describe("Cache Key Generation", () => {
    it("should generate consistent pool cache keys", () => {
      const poolId = createMockPoolIdV2("12345");
      const key1 = generatePoolCacheKeyV2(poolId);
      const key2 = generatePoolCacheKeyV2(poolId);

      expect(key1).toBe(key2);
      expect(key1).toBe("pool-v2-12345");
    });

    it("should generate consistent bin cache keys", () => {
      const poolId = createMockPoolIdV2("12345");
      const binId = 8388608;
      const key1 = generateBinCacheKey(poolId, binId);
      const key2 = generateBinCacheKey(poolId, binId);

      expect(key1).toBe(key2);
      expect(key1).toBe("bin-12345-8388608");
    });

    it("should generate consistent fee cache keys", () => {
      const poolId = createMockPoolIdV2("12345");
      const key1 = generateFeeCacheKey(poolId);
      const key2 = generateFeeCacheKey(poolId);

      expect(key1).toBe(key2);
      expect(key1).toBe("fee-v2-12345");
    });
  });
});
