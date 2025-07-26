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

describe("Task 4: Batch Preview Methods with Cache Support", () => {
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

  describe("previewSwapExactInputBatch", () => {
    it("should accept CacheOptions parameter", async () => {
      const cacheOptions: CacheOptions = {
        useCache: true,
        preloadPools: true,
        cacheTTL: 60000,
        refreshStaleData: true,
      };

      const assetIdIn = {bits: "0x1"};
      const assetAmountIn = new BN(100000);

      // Should not throw and should accept the cache options
      const results = await amm.previewSwapExactInputBatch(
        assetIdIn,
        assetAmountIn,
        mockRoutes,
        cacheOptions
      );

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(mockRoutes.length);
    });

    it("should preload pools when preloadPools is enabled", async () => {
      const cacheOptions: CacheOptions = {
        useCache: true,
        preloadPools: true,
      };

      const assetIdIn = {bits: "0x1"};
      const assetAmountIn = new BN(100000);

      // Spy on poolMetadataBatch to verify preloading
      const poolMetadataBatchSpy = jest.spyOn(amm, "poolMetadataBatch");

      await amm.previewSwapExactInputBatch(
        assetIdIn,
        assetAmountIn,
        mockRoutes,
        cacheOptions
      );

      // Should have called poolMetadataBatch for preloading
      expect(poolMetadataBatchSpy).toHaveBeenCalled();
    });

    it("should work without caching when useCache is false", async () => {
      const cacheOptions: CacheOptions = {
        useCache: false,
      };

      const assetIdIn = {bits: "0x1"};
      const assetAmountIn = new BN(100000);

      const results = await amm.previewSwapExactInputBatch(
        assetIdIn,
        assetAmountIn,
        mockRoutes,
        cacheOptions
      );

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });

    it("should handle cache preloading failures gracefully", async () => {
      const cacheOptions: CacheOptions = {
        useCache: true,
        preloadPools: true,
      };

      const assetIdIn = {bits: "0x1"};
      const assetAmountIn = new BN(100000);

      // Mock poolMetadataBatch to throw an error during preloading
      const originalMethod = amm.poolMetadataBatch.bind(amm);
      let callCount = 0;
      jest
        .spyOn(amm, "poolMetadataBatch")
        .mockImplementation(
          async (poolIds: PoolId[], options?: CacheOptions) => {
            callCount++;
            if (callCount === 1) {
              // First call (preloading) should fail
              throw new Error("Network error during preloading");
            }
            // Subsequent calls should work normally
            return originalMethod(poolIds, options);
          }
        );

      // Should not throw despite preloading failure
      const results = await amm.previewSwapExactInputBatch(
        assetIdIn,
        assetAmountIn,
        mockRoutes,
        cacheOptions
      );

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe("previewSwapExactOutputBatch", () => {
    it("should accept CacheOptions parameter", async () => {
      const cacheOptions: CacheOptions = {
        useCache: true,
        preloadPools: true,
        cacheTTL: 60000,
        refreshStaleData: true,
      };

      const assetIdOut = {bits: "0x4"};
      const assetAmountOut = new BN(100000);

      // Should not throw and should accept the cache options
      const results = await amm.previewSwapExactOutputBatch(
        assetIdOut,
        assetAmountOut,
        mockRoutes,
        cacheOptions
      );

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(mockRoutes.length);
    });

    it("should preload pools when preloadPools is enabled", async () => {
      const cacheOptions: CacheOptions = {
        useCache: true,
        preloadPools: true,
      };

      const assetIdOut = {bits: "0x4"};
      const assetAmountOut = new BN(100000);

      // Spy on poolMetadataBatch to verify preloading
      const poolMetadataBatchSpy = jest.spyOn(amm, "poolMetadataBatch");

      await amm.previewSwapExactOutputBatch(
        assetIdOut,
        assetAmountOut,
        mockRoutes,
        cacheOptions
      );

      // Should have called poolMetadataBatch for preloading
      expect(poolMetadataBatchSpy).toHaveBeenCalled();
    });

    it("should work without caching when useCache is false", async () => {
      const cacheOptions: CacheOptions = {
        useCache: false,
      };

      const assetIdOut = {bits: "0x4"};
      const assetAmountOut = new BN(100000);

      const results = await amm.previewSwapExactOutputBatch(
        assetIdOut,
        assetAmountOut,
        mockRoutes,
        cacheOptions
      );

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });

    it("should handle cache preloading failures gracefully", async () => {
      const cacheOptions: CacheOptions = {
        useCache: true,
        preloadPools: true,
      };

      const assetIdOut = {bits: "0x4"};
      const assetAmountOut = new BN(100000);

      // Mock poolMetadataBatch to throw an error during preloading
      const originalMethod = amm.poolMetadataBatch.bind(amm);
      let callCount = 0;
      jest
        .spyOn(amm, "poolMetadataBatch")
        .mockImplementation(
          async (poolIds: PoolId[], options?: CacheOptions) => {
            callCount++;
            if (callCount === 1) {
              // First call (preloading) should fail
              throw new Error("Network error during preloading");
            }
            // Subsequent calls should work normally
            return originalMethod(poolIds, options);
          }
        );

      // Should not throw despite preloading failure
      const results = await amm.previewSwapExactOutputBatch(
        assetIdOut,
        assetAmountOut,
        mockRoutes,
        cacheOptions
      );

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe("Identical implementation between both methods", () => {
    it("should use identical caching logic in both methods", async () => {
      const cacheOptions: CacheOptions = {
        useCache: true,
        preloadPools: true,
      };

      const assetIdIn = {bits: "0x1"};
      const assetIdOut = {bits: "0x4"};
      const amount = new BN(100000);

      // Spy on preloadPoolsForRoutes to verify both methods use preloading
      const preloadSpy = jest.spyOn(amm, "preloadPoolsForRoutes");

      // Clear spies
      preloadSpy.mockClear();

      // Test input batch method
      await amm.previewSwapExactInputBatch(
        assetIdIn,
        amount,
        mockRoutes,
        cacheOptions
      );

      const inputPreloadCalls = preloadSpy.mock.calls.length;

      // Clear spies again
      preloadSpy.mockClear();

      // Test output batch method
      await amm.previewSwapExactOutputBatch(
        assetIdOut,
        amount,
        mockRoutes,
        cacheOptions
      );

      const outputPreloadCalls = preloadSpy.mock.calls.length;

      // Both methods should use identical preloading logic
      expect(inputPreloadCalls).toBe(outputPreloadCalls);
      expect(inputPreloadCalls).toBeGreaterThan(0); // Should have preloaded

      // Verify both methods called preloadPoolsForRoutes with the same routes
      expect(preloadSpy).toHaveBeenCalledWith(
        mockRoutes,
        expect.objectContaining(cacheOptions)
      );
    });
  });
});
