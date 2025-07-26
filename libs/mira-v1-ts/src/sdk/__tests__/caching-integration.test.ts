/**
 * Caching Integration Tests
 * Tests for caching functionality in swap calculations and batch preview methods
 */

import {BN, AssetId} from "fuels";
import {ReadonlyMiraAmm} from "../readonly_mira_amm";
import {CacheOptions} from "../cache";
import {PoolId} from "../model";

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

import {vi} from "vitest";

// Mock the MiraAmmContract constructor
vi.mock("../typegen/MiraAmmContract", () => ({
  MiraAmmContract: vi.fn().mockImplementation(() => mockContract),
}));

describe("Caching Integration Tests", () => {
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

  describe("Swap Calculation Caching (getAmountsOut/getAmountsIn)", () => {
    it("should accept CacheOptions parameter for getAmountsOut", async () => {
      const cacheOptions: CacheOptions = {
        useCache: true,
        preloadPools: true,
        cacheTTL: 60000,
        refreshStaleData: true,
      };

      const assetIdIn = {bits: "0x1"};
      const assetAmountIn = new BN(100000);

      // Should not throw and should accept the cache options
      const result = await amm.getAmountsOut(
        assetIdIn,
        assetAmountIn,
        [mockPoolIds[0]],
        cacheOptions
      );

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should accept CacheOptions parameter for getAmountsIn", async () => {
      const cacheOptions: CacheOptions = {
        useCache: true,
        preloadPools: true,
        cacheTTL: 60000,
        refreshStaleData: true,
      };

      const assetIdOut = {bits: "0x2"};
      const assetAmountOut = new BN(100000);

      // Should not throw and should accept the cache options
      const result = await amm.getAmountsIn(
        assetIdOut,
        assetAmountOut,
        [mockPoolIds[0]],
        cacheOptions
      );

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should maintain backward compatibility without options", async () => {
      const assetIdIn = {bits: "0x1"};
      const assetAmountIn = new BN(100000);

      // Should work without cache options (backward compatibility)
      const result = await amm.getAmountsOut(assetIdIn, assetAmountIn, [
        mockPoolIds[0],
      ]);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("Batch Preview Methods with Cache Support", () => {
    it("should accept CacheOptions parameter for previewSwapExactInputBatch", async () => {
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

    it("should accept CacheOptions parameter for previewSwapExactOutputBatch", async () => {
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

      const assetIdIn = {bits: "0x1"};
      const assetAmountIn = new BN(100000);

      // Spy on poolMetadataBatch to verify preloading
      const poolMetadataBatchSpy = vi.spyOn(amm, "poolMetadataBatch");

      await amm.previewSwapExactInputBatch(
        assetIdIn,
        assetAmountIn,
        mockRoutes,
        cacheOptions
      );

      // Should have called poolMetadataBatch for preloading
      expect(poolMetadataBatchSpy).toHaveBeenCalled();
    });

    it("should maintain backward compatibility for batch methods", async () => {
      const assetIdIn = {bits: "0x1"};
      const assetAmountIn = new BN(100000);

      // Should work without cache options (backward compatibility)
      const results = await amm.previewSwapExactInputBatch(
        assetIdIn,
        assetAmountIn,
        mockRoutes
      );

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(mockRoutes.length);
    });
  });
});
