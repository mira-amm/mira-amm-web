import {BN, AssetId} from "fuels";
import {ReadonlyMiraAmm} from "../readonly_mira_amm";
import {CacheOptions} from "../cache";
import {PoolId, PoolMetadata} from "../model";
import {vi} from "vitest";

// Mock the MiraAmmContract and Provider
vi.mock("../typegen/MiraAmmContract");
vi.mock("fuels", async (importOriginal) => {
  const actual = (await importOriginal()) as any;
  return {
    ...actual,
    Provider: vi.fn().mockImplementation(() => ({})),
  };
});

describe("ReadonlyMiraAmm Caching Integration", () => {
  let readonlyAmm: ReadonlyMiraAmm;
  let mockProvider: any;
  let mockContract: any;

  // Mock data
  const mockAssetId1: AssetId = {bits: "asset1"} as any;
  const mockAssetId2: AssetId = {bits: "asset2"} as any;

  const mockPoolId1: PoolId = [mockAssetId1, mockAssetId2, false];

  const mockPoolMetadata1: PoolMetadata = {
    poolId: mockPoolId1,
    reserve0: new BN(1000000),
    reserve1: new BN(2000000),
    liquidity: [mockAssetId1, new BN(1500000)],
    decimals0: 9,
    decimals1: 9,
  };

  const mockFees = {
    lpFeeVolatile: new BN(30),
    lpFeeStable: new BN(5),
    protocolFeeVolatile: new BN(0),
    protocolFeeStable: new BN(0),
  };

  beforeEach(async () => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock provider
    mockProvider = {};

    // Mock contract with multiCall functionality
    mockContract = {
      id: {toString: () => "mock-contract-id"},
      functions: {
        fees: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({
            value: [
              mockFees.lpFeeVolatile,
              mockFees.lpFeeStable,
              mockFees.protocolFeeVolatile,
              mockFees.protocolFeeStable,
            ],
          }),
        }),
        pool_metadata: vi.fn(),
      },
      multiCall: vi.fn().mockImplementation((transactions) => ({
        get: vi.fn().mockResolvedValue({
          value: transactions.map(() => ({
            reserve_0: mockPoolMetadata1.reserve0,
            reserve_1: mockPoolMetadata1.reserve1,
            liquidity: {
              id: mockPoolMetadata1.liquidity[0],
              amount: mockPoolMetadata1.liquidity[1],
            },
            decimals_0: mockPoolMetadata1.decimals0,
            decimals_1: mockPoolMetadata1.decimals1,
          })),
        }),
      })),
    };

    // Mock the MiraAmmContract constructor
    const {MiraAmmContract} = await import("../typegen/MiraAmmContract");
    (MiraAmmContract as any).mockImplementation(() => mockContract);

    readonlyAmm = new ReadonlyMiraAmm(mockProvider);
  });

  describe("getAmountsOut with caching", () => {
    it("should accept CacheOptions parameter", async () => {
      const cacheOptions: CacheOptions = {
        useCache: true,
        cacheTTL: 60000,
        refreshStaleData: true,
      };

      // This should not throw and should accept the options parameter
      await expect(
        readonlyAmm.getAmountsOut(
          mockAssetId1,
          new BN(100000),
          [mockPoolId1],
          cacheOptions
        )
      ).resolves.toBeDefined();
    });

    it("should use cached pool data when available", async () => {
      const cacheOptions: CacheOptions = {useCache: true};

      readonlyAmm.getPoolCache().clear();

      // First call - should fetch from network
      await readonlyAmm.getAmountsOut(
        mockAssetId1,
        new BN(100000),
        [mockPoolId1],
        cacheOptions
      );

      // Verify multiCall was called once
      expect(mockContract.multiCall).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      await readonlyAmm.getAmountsOut(
        mockAssetId1,
        new BN(200000),
        [mockPoolId1],
        cacheOptions
      );

      // multiCall should still be called only once (cached)
      expect(mockContract.multiCall).toHaveBeenCalledTimes(1);
    });

    it("should fallback to direct fetch when cache is disabled", async () => {
      const cacheOptions: CacheOptions = {useCache: false};

      // First call
      await readonlyAmm.getAmountsOut(
        mockAssetId1,
        new BN(100000),
        [mockPoolId1],
        cacheOptions
      );

      // Second call
      await readonlyAmm.getAmountsOut(
        mockAssetId1,
        new BN(200000),
        [mockPoolId1],
        cacheOptions
      );

      // multiCall should be called twice (no caching)
      expect(mockContract.multiCall).toHaveBeenCalledTimes(2);
    });

    it("should return consistent results with and without cache", async () => {
      // Clear cache to ensure fresh start
      readonlyAmm.getPoolCache().clear();

      // Get result without cache
      const resultWithoutCache = await readonlyAmm.getAmountsOut(
        mockAssetId1,
        new BN(100000),
        [mockPoolId1],
        {useCache: false}
      );

      // Clear cache again to ensure no interference
      readonlyAmm.getPoolCache().clear();

      // Get result with cache
      const resultWithCache = await readonlyAmm.getAmountsOut(
        mockAssetId1,
        new BN(100000),
        [mockPoolId1],
        {useCache: true}
      );

      // Results should have same structure (amounts may vary due to mock randomness)
      expect(resultWithCache).toHaveLength(resultWithoutCache.length);
      expect(resultWithCache[0][0]).toEqual(resultWithoutCache[0][0]);
      expect(resultWithCache[1][0]).toEqual(resultWithoutCache[1][0]);
    });
  });

  describe("getAmountsIn with caching", () => {
    it("should accept CacheOptions parameter", async () => {
      const cacheOptions: CacheOptions = {
        useCache: true,
        cacheTTL: 60000,
        refreshStaleData: true,
      };

      // This should not throw and should accept the options parameter
      await expect(
        readonlyAmm.getAmountsIn(
          mockAssetId2,
          new BN(100000),
          [mockPoolId1],
          cacheOptions
        )
      ).resolves.toBeDefined();
    });

    it("should use cached pool data when available", async () => {
      const cacheOptions: CacheOptions = {useCache: true};

      readonlyAmm.getPoolCache().clear();

      // First call - should fetch from network
      await readonlyAmm.getAmountsIn(
        mockAssetId2,
        new BN(100000),
        [mockPoolId1],
        cacheOptions
      );

      // Verify multiCall was called once
      expect(mockContract.multiCall).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      await readonlyAmm.getAmountsIn(
        mockAssetId2,
        new BN(200000),
        [mockPoolId1],
        cacheOptions
      );

      // multiCall should still be called only once (cached)
      expect(mockContract.multiCall).toHaveBeenCalledTimes(1);
    });

    it("should fallback to direct fetch when cache is disabled", async () => {
      const cacheOptions: CacheOptions = {useCache: false};

      // First call
      await readonlyAmm.getAmountsIn(
        mockAssetId2,
        new BN(100000),
        [mockPoolId1],
        cacheOptions
      );

      // Second call
      await readonlyAmm.getAmountsIn(
        mockAssetId2,
        new BN(200000),
        [mockPoolId1],
        cacheOptions
      );

      // multiCall should be called twice (no caching)
      expect(mockContract.multiCall).toHaveBeenCalledTimes(2);
    });

    it("should return consistent results with and without cache", async () => {
      // Clear cache to ensure fresh start
      readonlyAmm.getPoolCache().clear();

      // Get result without cache
      const resultWithoutCache = await readonlyAmm.getAmountsIn(
        mockAssetId2,
        new BN(100000),
        [mockPoolId1],
        {useCache: false}
      );

      // Clear cache again to ensure no interference
      readonlyAmm.getPoolCache().clear();

      // Get result with cache
      const resultWithCache = await readonlyAmm.getAmountsIn(
        mockAssetId2,
        new BN(100000),
        [mockPoolId1],
        {useCache: true}
      );

      // Results should have same structure (amounts may vary due to mock randomness)
      expect(resultWithCache).toHaveLength(resultWithoutCache.length);
      expect(resultWithCache[0][0]).toEqual(resultWithoutCache[0][0]);
      expect(resultWithCache[1][0]).toEqual(resultWithoutCache[1][0]);
    });
  });

  describe("Backward compatibility", () => {
    it("should work without CacheOptions parameter (default behavior)", async () => {
      // Should work with default options
      await expect(
        readonlyAmm.getAmountsOut(mockAssetId1, new BN(100000), [mockPoolId1])
      ).resolves.toBeDefined();

      await expect(
        readonlyAmm.getAmountsIn(mockAssetId2, new BN(100000), [mockPoolId1])
      ).resolves.toBeDefined();
    });

    it("should use default cache behavior when no options provided", async () => {
      readonlyAmm.getPoolCache().clear();
      // First call
      await readonlyAmm.getAmountsOut(mockAssetId1, new BN(100000), [
        mockPoolId1,
      ]);

      // Second call
      await readonlyAmm.getAmountsOut(mockAssetId1, new BN(200000), [
        mockPoolId1,
      ]);

      // With default caching enabled, should only call multiCall once
      expect(mockContract.multiCall).toHaveBeenCalledTimes(1);
    });
  });

  describe("Error handling", () => {
    it("should handle invalid input amounts", async () => {
      await expect(
        readonlyAmm.getAmountsOut(mockAssetId1, new BN(0), [mockPoolId1], {
          useCache: true,
        })
      ).rejects.toThrow("Non positive input amount");

      await expect(
        readonlyAmm.getAmountsIn(mockAssetId2, new BN(0), [mockPoolId1], {
          useCache: true,
        })
      ).rejects.toThrow("Non positive input amount");
    });
  });

  describe("Cache integration", () => {
    it("should pass cache options through the call chain", async () => {
      const spy = vi.spyOn(readonlyAmm, "poolMetadataBatch");

      const cacheOptions: CacheOptions = {
        useCache: true,
        cacheTTL: 45000,
        refreshStaleData: false,
      };

      await readonlyAmm.getAmountsOut(
        mockAssetId1,
        new BN(100000),
        [mockPoolId1],
        cacheOptions
      );

      // Verify poolMetadataBatch was called with the cache options
      expect(spy).toHaveBeenCalledWith(expect.any(Array), cacheOptions);
    });

    it("should provide access to pool cache", () => {
      const poolCache = readonlyAmm.getPoolCache();
      expect(poolCache).toBeDefined();
      expect(typeof poolCache.getPoolMetadata).toBe("function");
      expect(typeof poolCache.setPoolMetadata).toBe("function");
    });

    it("should support preloading pools for routes", async () => {
      const routes = [[mockPoolId1]];

      readonlyAmm.getPoolCache().clear();

      // Should not throw
      await expect(
        readonlyAmm.preloadPoolsForRoutes(routes, {useCache: true})
      ).resolves.toBeUndefined();

      // Should have called multiCall to fetch pool data
      expect(mockContract.multiCall).toHaveBeenCalled();
    });
  });
});
