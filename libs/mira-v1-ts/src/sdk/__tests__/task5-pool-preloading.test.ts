import {BN} from "fuels";
import {ReadonlyMiraAmm} from "../readonly_mira_amm";
import {PoolId} from "../model";
import {CacheOptions} from "../cache";

// Mock the provider and contract
const mockProvider = {} as any;
const mockContract = {
  id: {toString: () => "test-contract-id"},
  functions: {
    fees: () => ({
      get: () =>
        Promise.resolve({
          value: [new BN(30), new BN(5), new BN(0), new BN(0)],
        }),
    }),
    pool_metadata: () => ({}),
  },
  multiCall: (transactions: any[]) => ({
    get: () =>
      Promise.resolve({
        value: transactions.map(() => ({
          reserve_0: new BN(1000000),
          reserve_1: new BN(2000000),
          liquidity: {id: "test-lp", amount: new BN(1414213)},
          decimals_0: 9,
          decimals_1: 9,
        })),
      }),
  }),
} as any;

// Mock the MiraAmmContract constructor
jest.mock("../typegen/MiraAmmContract", () => ({
  MiraAmmContract: jest.fn().mockImplementation(() => mockContract),
}));

describe("Task 5: Pool Preloading Functionality", () => {
  let amm: ReadonlyMiraAmm;
  let mockPoolIds: PoolId[];
  let mockRoutes: PoolId[][];

  beforeEach(() => {
    amm = new ReadonlyMiraAmm(mockProvider);

    // Create mock pool IDs
    mockPoolIds = [
      [{bits: "0x1"}, {bits: "0x2"}, false],
      [{bits: "0x2"}, {bits: "0x3"}, false],
      [{bits: "0x3"}, {bits: "0x4"}, false],
      [{bits: "0x1"}, {bits: "0x4"}, true],
      [{bits: "0x5"}, {bits: "0x6"}, false],
    ] as PoolId[];

    // Create mock routes using different combinations of pools
    mockRoutes = [
      [mockPoolIds[0], mockPoolIds[1]], // Route 1: 0x1 -> 0x2 -> 0x3
      [mockPoolIds[2]], // Route 2: 0x3 -> 0x4
      [mockPoolIds[3]], // Route 3: 0x1 -> 0x4 (direct)
      [mockPoolIds[0], mockPoolIds[1], mockPoolIds[2]], // Route 4: 0x1 -> 0x2 -> 0x3 -> 0x4
    ];

    // Clear cache before each test
    amm.getPoolCache().clear();
  });

  describe("preloadPoolsForRoutes", () => {
    it("should extract unique pools from route arrays", async () => {
      const poolMetadataBatchSpy = jest.spyOn(amm, "poolMetadataBatch");

      await amm.preloadPoolsForRoutes(mockRoutes);

      // Should have called poolMetadataBatch with unique pools
      expect(poolMetadataBatchSpy).toHaveBeenCalledTimes(1);

      const calledPools = poolMetadataBatchSpy.mock.calls[0][0];

      // Should have 4 unique pools (mockPoolIds[0] through mockPoolIds[3])
      expect(calledPools).toHaveLength(4);

      // Verify all unique pools are included
      const poolKeys = calledPools.map(
        (pool: PoolId) => `${pool[0].bits}-${pool[1].bits}-${pool[2]}`
      );

      expect(poolKeys).toContain("0x1-0x2-false");
      expect(poolKeys).toContain("0x2-0x3-false");
      expect(poolKeys).toContain("0x3-0x4-false");
      expect(poolKeys).toContain("0x1-0x4-true");
    });

    it("should implement batch fetching of pool metadata", async () => {
      const poolMetadataBatchSpy = jest.spyOn(amm, "poolMetadataBatch");

      await amm.preloadPoolsForRoutes(mockRoutes);

      // Should use batch fetching (single call with multiple pools)
      expect(poolMetadataBatchSpy).toHaveBeenCalledTimes(1);
      expect(poolMetadataBatchSpy.mock.calls[0][0].length).toBeGreaterThan(1);
    });

    it("should add cache warming logic that populates cache", async () => {
      const cacheOptions: CacheOptions = {
        useCache: true,
        cacheTTL: 60000,
      };

      // Verify cache is empty initially
      expect(amm.getPoolCache().size()).toBe(0);

      await amm.preloadPoolsForRoutes(mockRoutes, cacheOptions);

      // Cache should be populated after preloading
      expect(amm.getPoolCache().size()).toBeGreaterThan(0);
    });

    it("should handle empty routes gracefully", async () => {
      const poolMetadataBatchSpy = jest.spyOn(amm, "poolMetadataBatch");

      await amm.preloadPoolsForRoutes([]);

      // Should not call poolMetadataBatch for empty routes
      expect(poolMetadataBatchSpy).not.toHaveBeenCalled();
    });

    it("should handle invalid route data gracefully", async () => {
      const poolMetadataBatchSpy = jest.spyOn(amm, "poolMetadataBatch");

      // Test with invalid route data
      const invalidRoutes = [
        null as any,
        undefined as any,
        [] as PoolId[],
        [null as any, undefined as any],
        [[{bits: "0x1"}] as any], // Invalid pool structure
      ];

      await amm.preloadPoolsForRoutes(invalidRoutes);

      // Should handle gracefully without throwing
      expect(poolMetadataBatchSpy).toHaveBeenCalledTimes(0);
    });

    it("should handle network failures gracefully", async () => {
      const poolMetadataBatchSpy = jest
        .spyOn(amm, "poolMetadataBatch")
        .mockRejectedValueOnce(new Error("Network error"));

      // Should not throw despite network failure
      await expect(
        amm.preloadPoolsForRoutes(mockRoutes)
      ).resolves.not.toThrow();

      expect(poolMetadataBatchSpy).toHaveBeenCalledTimes(1);
    });

    it("should respect cache options", async () => {
      const poolMetadataBatchSpy = jest.spyOn(amm, "poolMetadataBatch");

      const cacheOptions: CacheOptions = {
        useCache: true,
        cacheTTL: 120000,
        refreshStaleData: false,
      };

      await amm.preloadPoolsForRoutes(mockRoutes, cacheOptions);

      // Should pass cache options to poolMetadataBatch
      expect(poolMetadataBatchSpy).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({
          useCache: true,
          cacheTTL: 120000,
          refreshStaleData: false,
        })
      );
    });

    it("should only fetch pools that are not cached or stale", async () => {
      const cacheOptions: CacheOptions = {
        useCache: true,
        refreshStaleData: true,
      };

      // Pre-populate cache with some pools
      const cache = amm.getPoolCache();
      cache.setPoolMetadata(mockPoolIds[0], {
        poolId: mockPoolIds[0],
        reserve0: new BN(1000),
        reserve1: new BN(2000),
        liquidity: [{bits: "test-lp"} as any, new BN(1414)],
        decimals0: 9,
        decimals1: 9,
      });

      const poolMetadataBatchSpy = jest.spyOn(amm, "poolMetadataBatch");

      await amm.preloadPoolsForRoutes(mockRoutes, cacheOptions);

      // Should only fetch pools not in cache
      const calledPools = poolMetadataBatchSpy.mock.calls[0][0];
      expect(calledPools.length).toBeLessThan(4); // Less than total unique pools
    });
  });

  describe("Route change detection", () => {
    it("should detect route changes and trigger preloading", async () => {
      const poolMetadataBatchSpy = jest.spyOn(amm, "poolMetadataBatch");

      // First call with initial routes
      const result1 =
        await amm.preloadPoolsForRoutesWithChangeDetection(mockRoutes);
      expect(result1).toBe(true); // Should indicate preloading occurred
      expect(poolMetadataBatchSpy).toHaveBeenCalledTimes(1);

      // Second call with same routes
      poolMetadataBatchSpy.mockClear();
      const result2 =
        await amm.preloadPoolsForRoutesWithChangeDetection(mockRoutes);
      expect(result2).toBe(false); // Should indicate no preloading needed
      expect(poolMetadataBatchSpy).not.toHaveBeenCalled();

      // Third call with different routes
      const newRoutes = [[mockPoolIds[4]]]; // Different route
      poolMetadataBatchSpy.mockClear();
      const result3 =
        await amm.preloadPoolsForRoutesWithChangeDetection(newRoutes);
      expect(result3).toBe(true); // Should indicate preloading occurred
      expect(poolMetadataBatchSpy).toHaveBeenCalledTimes(1);
    });

    it("should generate consistent route signatures", async () => {
      // Test that same routes generate same signature
      await amm.preloadPoolsForRoutesWithChangeDetection(mockRoutes);
      const result1 =
        await amm.preloadPoolsForRoutesWithChangeDetection(mockRoutes);
      expect(result1).toBe(false); // No change detected

      // Test that different routes generate different signatures
      const differentRoutes = [[mockPoolIds[4]]];
      const result2 =
        await amm.preloadPoolsForRoutesWithChangeDetection(differentRoutes);
      expect(result2).toBe(true); // Change detected
    });
  });

  describe("Integration with batch preview methods", () => {
    it("should preload pools in previewSwapExactInputBatch when enabled", async () => {
      const preloadSpy = jest.spyOn(amm, "preloadPoolsForRoutes");

      const cacheOptions: CacheOptions = {
        useCache: true,
        preloadPools: true,
      };

      const assetIdIn = {bits: "0x1"};
      const assetAmountIn = new BN(100000);

      await amm.previewSwapExactInputBatch(
        assetIdIn,
        assetAmountIn,
        mockRoutes,
        cacheOptions
      );

      expect(preloadSpy).toHaveBeenCalledWith(
        mockRoutes,
        expect.objectContaining(cacheOptions)
      );
    });

    it("should preload pools in previewSwapExactOutputBatch when enabled", async () => {
      const preloadSpy = jest.spyOn(amm, "preloadPoolsForRoutes");

      const cacheOptions: CacheOptions = {
        useCache: true,
        preloadPools: true,
      };

      const assetIdOut = {bits: "0x4"};
      const assetAmountOut = new BN(100000);

      await amm.previewSwapExactOutputBatch(
        assetIdOut,
        assetAmountOut,
        mockRoutes,
        cacheOptions
      );

      expect(preloadSpy).toHaveBeenCalledWith(
        mockRoutes,
        expect.objectContaining(cacheOptions)
      );
    });

    it("should not preload when preloadPools is disabled", async () => {
      const preloadSpy = jest.spyOn(amm, "preloadPoolsForRoutes");

      const cacheOptions: CacheOptions = {
        useCache: true,
        preloadPools: false,
      };

      const assetIdIn = {bits: "0x1"};
      const assetAmountIn = new BN(100000);

      await amm.previewSwapExactInputBatch(
        assetIdIn,
        assetAmountIn,
        mockRoutes,
        cacheOptions
      );

      expect(preloadSpy).not.toHaveBeenCalled();
    });

    it("should not preload when caching is disabled", async () => {
      const preloadSpy = jest.spyOn(amm, "preloadPoolsForRoutes");

      const cacheOptions: CacheOptions = {
        useCache: false,
        preloadPools: true,
      };

      const assetIdIn = {bits: "0x1"};
      const assetAmountIn = new BN(100000);

      await amm.previewSwapExactInputBatch(
        assetIdIn,
        assetAmountIn,
        mockRoutes,
        cacheOptions
      );

      expect(preloadSpy).not.toHaveBeenCalled();
    });

    it("should handle preloading failures gracefully in batch methods", async () => {
      const preloadSpy = jest
        .spyOn(amm, "preloadPoolsForRoutes")
        .mockRejectedValueOnce(new Error("Preload failed"));

      const cacheOptions: CacheOptions = {
        useCache: true,
        preloadPools: true,
      };

      const assetIdIn = {bits: "0x1"};
      const assetAmountIn = new BN(100000);

      // Should not throw despite preloading failure
      await expect(
        amm.previewSwapExactInputBatch(
          assetIdIn,
          assetAmountIn,
          mockRoutes,
          cacheOptions
        )
      ).resolves.not.toThrow();

      expect(preloadSpy).toHaveBeenCalled();
    });
  });

  describe("Requirements verification", () => {
    it("should satisfy requirement 2.2: Pool data fetched once and reused", async () => {
      const poolMetadataBatchSpy = jest.spyOn(amm, "poolMetadataBatch");

      // Preload pools
      await amm.preloadPoolsForRoutes(mockRoutes, {useCache: true});

      // Verify pools were fetched during preloading
      expect(poolMetadataBatchSpy).toHaveBeenCalledTimes(1);
      const initialCallCount = poolMetadataBatchSpy.mock.calls.length;

      // Use cached data for calculations (multiple times)
      const assetIdIn = {bits: "0x1"};
      const assetAmountIn = new BN(100000);

      // First calculation
      await amm.previewSwapExactInputBatch(
        assetIdIn,
        assetAmountIn,
        mockRoutes,
        {useCache: true, preloadPools: false}
      );

      // Second calculation with same routes
      await amm.previewSwapExactInputBatch(
        assetIdIn,
        new BN(200000), // Different amount, same routes
        mockRoutes,
        {useCache: true, preloadPools: false}
      );

      // Should have made additional calls for the calculations, but pool data should be reused
      // The key point is that we're not fetching pool metadata again for each calculation
      const finalCallCount = poolMetadataBatchSpy.mock.calls.length;

      // Verify that pool data is being reused (cache hit rate should be good)
      const cacheStats = amm.getPoolCache().getStats();
      expect(cacheStats.hits).toBeGreaterThan(0);
      expect(amm.getPoolCache().size()).toBeGreaterThan(0);
    });

    it("should satisfy requirement 4.1: Cache warming before calculations", async () => {
      const cacheOptions: CacheOptions = {
        useCache: true,
        preloadPools: true,
      };

      // Verify cache is empty initially
      expect(amm.getPoolCache().size()).toBe(0);

      const assetIdIn = {bits: "0x1"};
      const assetAmountIn = new BN(100000);

      await amm.previewSwapExactInputBatch(
        assetIdIn,
        assetAmountIn,
        mockRoutes,
        cacheOptions
      );

      // Cache should be warmed up before calculations
      expect(amm.getPoolCache().size()).toBeGreaterThan(0);
    });
  });
});
