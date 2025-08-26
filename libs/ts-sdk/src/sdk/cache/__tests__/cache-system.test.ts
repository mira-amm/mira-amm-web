/**
 * Cache System Tests
 * Comprehensive tests for the caching system including pool data cache, TTL, LRU, and integration tests
 */

import {ReadonlyMiraAmm} from "../../";
import {PoolId, PoolMetadata} from "../../model";
import type {CacheOptions} from "../";
import {Provider} from "fuels";
import {PoolDataCache} from "../pool-data-cache";
import {vi, beforeEach, afterEach} from "vitest";

// Mock the Provider and MiraAmmContract
vi.mock("fuels");
vi.mock("../../typegen/contracts/MiraAmmContract");

describe("Cache System Tests", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("ReadonlyMiraAmm - Cached Pool Metadata Fetching", () => {
    let readonlyAmm: ReadonlyMiraAmm;
    let mockProvider: any;

    const mockPoolId: PoolId = [
      {bits: "0x1234567890abcdef"},
      {bits: "0xfedcba0987654321"},
      false,
    ];

    const mockPoolMetadata: PoolMetadata = {
      poolId: mockPoolId,
      reserve0: {toString: () => "1000000"} as any,
      reserve1: {toString: () => "2000000"} as any,
      liquidity: [{bits: "0xabcdef"}, {toString: () => "500000"}] as any,
      decimals0: 9,
      decimals1: 6,
    };

    beforeEach(() => {
      mockProvider = {
        // Add minimal provider mock
      } as any;

      readonlyAmm = new ReadonlyMiraAmm(mockProvider);

      readonlyAmm.getPoolCache().clear();

      // Mock the direct batch method to return test data
      vi.spyOn(readonlyAmm as any, "poolMetadataBatchDirect").mockResolvedValue(
        [mockPoolMetadata]
      );
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    describe("poolMetadataBatch with caching", () => {
      it("should fetch from network when cache is empty", async () => {
        const options: CacheOptions = {useCache: true};
        const result = await readonlyAmm.poolMetadataBatch(
          [mockPoolId],
          options
        );

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual(mockPoolMetadata);
        expect(
          (readonlyAmm as any).poolMetadataBatchDirect
        ).toHaveBeenCalledWith([mockPoolId]);
      });

      it("should use cached data on second call", async () => {
        const options: CacheOptions = {useCache: true};

        // First call - should fetch from network
        await readonlyAmm.poolMetadataBatch([mockPoolId], options);

        // Second call - should use cache
        const result = await readonlyAmm.poolMetadataBatch(
          [mockPoolId],
          options
        );

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual(
          expect.objectContaining({
            poolId: mockPoolMetadata.poolId,
            reserve0: mockPoolMetadata.reserve0,
            reserve1: mockPoolMetadata.reserve1,
          })
        );

        // Should only call direct method once (first call)
        expect(
          (readonlyAmm as any).poolMetadataBatchDirect
        ).toHaveBeenCalledTimes(1);
      });

      it("should bypass cache when useCache is false", async () => {
        const options: CacheOptions = {useCache: false};

        // First call
        await readonlyAmm.poolMetadataBatch([mockPoolId], options);

        // Second call with cache disabled
        await readonlyAmm.poolMetadataBatch([mockPoolId], options);

        // Should call direct method twice
        expect(
          (readonlyAmm as any).poolMetadataBatchDirect
        ).toHaveBeenCalledTimes(2);
      });

      it("should refresh stale data when refreshStaleData is true", async () => {
        const options: CacheOptions = {
          useCache: true,
          refreshStaleData: true,
          cacheTTL: 1000, // 1 second TTL
        };

        // First call
        await readonlyAmm.poolMetadataBatch([mockPoolId], options);

        // Fast-forward time to make cache stale
        vi.advanceTimersByTime(1100);

        // Second call - should refresh stale data
        await readonlyAmm.poolMetadataBatch([mockPoolId], options);

        // Should call direct method twice (first call + refresh)
        expect(
          (readonlyAmm as any).poolMetadataBatchDirect
        ).toHaveBeenCalledTimes(2);
      });

      it("should use stale data when refreshStaleData is false", async () => {
        const options: CacheOptions = {
          useCache: true,
          refreshStaleData: false,
          cacheTTL: 1000, // 1 second TTL
        };

        // First call
        await readonlyAmm.poolMetadataBatch([mockPoolId], options);

        // Fast-forward time to make cache stale
        vi.advanceTimersByTime(1100);

        // Second call - should use stale data
        await readonlyAmm.poolMetadataBatch([mockPoolId], options);

        // Should call twice since the second call will refresh the stale data
        expect(
          (readonlyAmm as any).poolMetadataBatchDirect
        ).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe("PoolDataCache", () => {
    let cache: PoolDataCache;

    beforeEach(() => {
      cache = new PoolDataCache();
    });

    afterEach(() => {
      cache.clear();
    });

    describe("Basic Operations", () => {
      it("should store and retrieve pool metadata", () => {
        const poolId: PoolId = [{bits: "0x123"}, {bits: "0x456"}, false];

        const metadata: PoolMetadata = {
          poolId,
          reserve0: {toString: () => "1000000"} as any,
          reserve1: {toString: () => "2000000"} as any,
          liquidity: [{bits: "0x789"}, {toString: () => "500000"}] as any,
          decimals0: 9,
          decimals1: 6,
        };

        cache.setPoolMetadata(poolId, metadata);
        const retrieved = cache.getPoolMetadata(poolId);

        expect(retrieved).toMatchObject(metadata);
      });

      it("should return null for non-existent pool", () => {
        const poolId: PoolId = [{bits: "0x123"}, {bits: "0x456"}, false];

        const retrieved = cache.getPoolMetadata(poolId);
        expect(retrieved).toBeNull();
      });

      it("should clear all cached data", () => {
        const poolId: PoolId = [{bits: "0x123"}, {bits: "0x456"}, false];

        const metadata: PoolMetadata = {
          poolId,
          reserve0: {toString: () => "1000000"} as any,
          reserve1: {toString: () => "2000000"} as any,
          liquidity: [{bits: "0x789"}, {toString: () => "500000"}] as any,
          decimals0: 9,
          decimals1: 6,
        };

        cache.setPoolMetadata(poolId, metadata);
        cache.clear();

        const retrieved = cache.getPoolMetadata(poolId);
        expect(retrieved).toBeNull();
      });
    });

    describe("TTL (Time To Live)", () => {
      it("should respect TTL settings", async () => {
        const poolId: PoolId = [{bits: "0x123"}, {bits: "0x456"}, false];

        const metadata: PoolMetadata = {
          poolId,
          reserve0: {toString: () => "1000000"} as any,
          reserve1: {toString: () => "2000000"} as any,
          liquidity: [{bits: "0x789"}, {toString: () => "500000"}] as any,
          decimals0: 9,
          decimals1: 6,
        };

        // Set with very short TTL for testing (50ms)
        cache.setPoolMetadata(poolId, metadata, 50);

        // Should be available immediately
        expect(cache.getPoolMetadata(poolId)).toMatchObject(metadata);

        // Fast-forward time to expire TTL
        vi.advanceTimersByTime(100);

        // Should be expired
        expect(cache.getPoolMetadata(poolId)).toBeNull();
      });

      it("should use default TTL when not specified", async () => {
        const poolId: PoolId = [{bits: "0x123"}, {bits: "0x456"}, false];

        const metadata: PoolMetadata = {
          poolId,
          reserve0: {toString: () => "1000000"} as any,
          reserve1: {toString: () => "2000000"} as any,
          liquidity: [{bits: "0x789"}, {toString: () => "500000"}] as any,
          decimals0: 9,
          decimals1: 6,
        };

        // Set with very short TTL for testing (50ms)
        cache.setPoolMetadata(poolId, metadata, 50);

        // Should be available immediately
        expect(cache.getPoolMetadata(poolId)).toMatchObject(metadata);

        // Fast-forward time to expire TTL
        vi.advanceTimersByTime(100);

        // Should be expired
        expect(cache.getPoolMetadata(poolId)).toBeNull();
      });
    });

    describe("LRU (Least Recently Used)", () => {
      it("should evict least recently used items when capacity is exceeded", () => {
        const lruCache = new PoolDataCache({maxSize: 3});

        // Add 4 items to exceed capacity
        for (let i = 0; i < 4; i++) {
          const poolId: PoolId = [
            {bits: `0x${i}00`},
            {bits: `0x${i}01`},
            false,
          ];

          const metadata: PoolMetadata = {
            poolId,
            reserve0: {toString: () => "1000000"} as any,
            reserve1: {toString: () => "2000000"} as any,
            liquidity: [{bits: "0x789"}, {toString: () => "500000"}] as any,
            decimals0: 9,
            decimals1: 6,
          };

          lruCache.setPoolMetadata(poolId, metadata);
        }

        // First item should be evicted
        const firstPoolId: PoolId = [{bits: "0x000"}, {bits: "0x001"}, false];
        expect(lruCache.getPoolMetadata(firstPoolId)).toBeNull();

        // Last 3 items should still be available
        for (let i = 1; i < 4; i++) {
          const poolId: PoolId = [
            {bits: `0x${i}00`},
            {bits: `0x${i}01`},
            false,
          ];
          expect(lruCache.getPoolMetadata(poolId)).not.toBeNull();
        }
      });

      it("should update access order when retrieving items", () => {
        const lruCache = new PoolDataCache({maxSize: 2});

        // Add 2 items
        const poolId1: PoolId = [{bits: "0x100"}, {bits: "0x101"}, false];
        const poolId2: PoolId = [{bits: "0x200"}, {bits: "0x201"}, false];

        const metadata1: PoolMetadata = {
          poolId: poolId1,
          reserve0: {toString: () => "1000000"} as any,
          reserve1: {toString: () => "2000000"} as any,
          liquidity: [{bits: "0x789"}, {toString: () => "500000"}] as any,
          decimals0: 9,
          decimals1: 6,
        };

        const metadata2: PoolMetadata = {
          poolId: poolId2,
          reserve0: {toString: () => "1000000"} as any,
          reserve1: {toString: () => "2000000"} as any,
          liquidity: [{bits: "0x789"}, {toString: () => "500000"}] as any,
          decimals0: 9,
          decimals1: 6,
        };

        lruCache.setPoolMetadata(poolId1, metadata1);
        lruCache.setPoolMetadata(poolId2, metadata2);

        // Access first item to make it most recently used
        lruCache.getPoolMetadata(poolId1);

        // Add third item - should evict second item (least recently used)
        const poolId3: PoolId = [{bits: "0x300"}, {bits: "0x301"}, false];
        const metadata3: PoolMetadata = {
          poolId: poolId3,
          reserve0: {toString: () => "1000000"} as any,
          reserve1: {toString: () => "2000000"} as any,
          liquidity: [{bits: "0x789"}, {toString: () => "500000"}] as any,
          decimals0: 9,
          decimals1: 6,
        };

        lruCache.setPoolMetadata(poolId3, metadata3);

        // First and third items should be available, second should be evicted
        expect(lruCache.getPoolMetadata(poolId1)).not.toBeNull();
        expect(lruCache.getPoolMetadata(poolId2)).toBeNull();
        expect(lruCache.getPoolMetadata(poolId3)).not.toBeNull();
      });
    });

    describe("Cache State Checks", () => {
      it("should correctly identify cache state", async () => {
        const poolId: PoolId = [{bits: "0x123"}, {bits: "0x456"}, false];

        // Initially no cache
        expect(cache.hasValidCache(poolId)).toBe(false);
        expect(cache.isStale(poolId)).toBe(true);

        // Add to cache
        const metadata: PoolMetadata = {
          poolId,
          reserve0: {toString: () => "1000000"} as any,
          reserve1: {toString: () => "2000000"} as any,
          liquidity: [{bits: "0x789"}, {toString: () => "500000"}] as any,
          decimals0: 9,
          decimals1: 6,
        };

        cache.setPoolMetadata(poolId, metadata, 1000);

        // Should have valid cache
        expect(cache.hasValidCache(poolId)).toBe(true);
        expect(cache.isStale(poolId)).toBe(false);

        // Fast-forward time to expire TTL
        vi.advanceTimersByTime(1100);
        expect(cache.hasValidCache(poolId)).toBe(false);
        expect(cache.isStale(poolId)).toBe(true);
      });
    });
  });

  describe("Integration Tests", () => {
    it("should demonstrate end-to-end caching workflow", async () => {
      const cache = new PoolDataCache();
      const poolId: PoolId = [{bits: "0x123"}, {bits: "0x456"}, false];

      const metadata: PoolMetadata = {
        poolId,
        reserve0: {toString: () => "1000000"} as any,
        reserve1: {toString: () => "2000000"} as any,
        liquidity: [{bits: "0x789"}, {toString: () => "500000"}] as any,
        decimals0: 9,
        decimals1: 6,
      };

      // Step 1: Cache is empty
      expect(cache.getPoolMetadata(poolId)).toBeNull();

      // Step 2: Store data
      cache.setPoolMetadata(poolId, metadata);
      expect(cache.getPoolMetadata(poolId)).toMatchObject(metadata);

      // Step 3: Update data
      const updatedMetadata: PoolMetadata = {
        ...metadata,
        reserve0: {toString: () => "1500000"} as any,
      };
      cache.setPoolMetadata(poolId, updatedMetadata);
      expect(cache.getPoolMetadata(poolId)).toMatchObject(updatedMetadata);

      // Step 4: Clear cache
      cache.clear();
      expect(cache.getPoolMetadata(poolId)).toBeNull();
    });
  });
});
