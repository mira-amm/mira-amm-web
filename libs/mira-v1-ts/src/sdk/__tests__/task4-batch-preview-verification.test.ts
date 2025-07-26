import {BN, AssetId} from "fuels";
import {ReadonlyMiraAmm} from "../readonly_mira_amm";
import {PoolId} from "../model";
import {CacheOptions} from "../cache";

// Mock the provider and contract
const mockProvider = {} as any;
const mockContract = {
  id: {toString: () => "mock-contract-id"},
  functions: {
    fees: () => ({
      get: () => ({
        value: [new BN(30), new BN(5), new BN(0), new BN(0)],
      }),
    }),
    pool_metadata: () => ({}),
  },
  multiCall: () => ({
    get: () => ({
      value: [],
    }),
  }),
} as any;

describe("Task 4: Batch Preview Methods with Cache Support", () => {
  let amm: ReadonlyMiraAmm;
  let mockAssetIn: AssetId;
  let mockAssetOut: AssetId;
  let mockRoutes: PoolId[][];

  beforeEach(() => {
    amm = new ReadonlyMiraAmm(mockProvider);
    (amm as any).ammContract = mockContract;

    // Mock assets
    mockAssetIn = {bits: "0x1111"} as AssetId;
    mockAssetOut = {bits: "0x2222"} as AssetId;

    // Mock routes
    mockRoutes = [
      [[mockAssetIn, mockAssetOut, false]],
      [
        [mockAssetIn, {bits: "0x3333"} as AssetId, false],
        [{bits: "0x3333"} as AssetId, mockAssetOut, false],
      ],
    ];

    // Mock the underlying methods to avoid actual network calls
    jest.spyOn(amm, "getAmountsOut").mockResolvedValue([
      [mockAssetIn, new BN(1000)],
      [mockAssetOut, new BN(950)],
    ]);

    jest.spyOn(amm, "getAmountsIn").mockResolvedValue([
      [mockAssetOut, new BN(1000)],
      [mockAssetIn, new BN(1050)],
    ]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("previewSwapExactInputBatch", () => {
    it("should accept CacheOptions parameter", async () => {
      const cacheOptions: CacheOptions = {
        useCache: true,
        preloadPools: true,
        cacheTTL: 60000,
        refreshStaleData: true,
      };

      const result = await amm.previewSwapExactInputBatch(
        mockAssetIn,
        new BN(1000),
        mockRoutes,
        cacheOptions
      );

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(mockRoutes.length);
    });

    it("should pass cache options to getAmountsOut", async () => {
      const cacheOptions: CacheOptions = {
        useCache: true,
        cacheTTL: 30000,
      };

      await amm.previewSwapExactInputBatch(
        mockAssetIn,
        new BN(1000),
        mockRoutes,
        cacheOptions
      );

      // Verify that getAmountsOut was called with cache options (merged with defaults)
      expect(amm.getAmountsOut).toHaveBeenCalledWith(
        mockAssetIn,
        new BN(1000),
        mockRoutes[0],
        expect.objectContaining(cacheOptions)
      );
      expect(amm.getAmountsOut).toHaveBeenCalledWith(
        mockAssetIn,
        new BN(1000),
        mockRoutes[1],
        expect.objectContaining(cacheOptions)
      );
    });

    it("should work without cache options (backward compatibility)", async () => {
      const result = await amm.previewSwapExactInputBatch(
        mockAssetIn,
        new BN(1000),
        mockRoutes
      );

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);

      // Verify that getAmountsOut was called with default options (merged with defaults)
      expect(amm.getAmountsOut).toHaveBeenCalledWith(
        mockAssetIn,
        new BN(1000),
        mockRoutes[0],
        expect.objectContaining({
          useCache: true,
          preloadPools: false,
          refreshStaleData: true,
          cacheTTL: 30000,
        })
      );
    });

    it("should handle route failures gracefully", async () => {
      // Mock one route to fail
      (amm.getAmountsOut as jest.Mock)
        .mockResolvedValueOnce([
          [mockAssetIn, new BN(1000)],
          [mockAssetOut, new BN(950)],
        ])
        .mockRejectedValueOnce(new Error("Route failed"));

      const result = await amm.previewSwapExactInputBatch(
        mockAssetIn,
        new BN(1000),
        mockRoutes
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual([mockAssetOut, new BN(950)]);
      expect(result[1]).toBeUndefined();
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

      const result = await amm.previewSwapExactOutputBatch(
        mockAssetOut,
        new BN(1000),
        mockRoutes,
        cacheOptions
      );

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(mockRoutes.length);
    });

    it("should pass cache options to getAmountsIn", async () => {
      const cacheOptions: CacheOptions = {
        useCache: true,
        cacheTTL: 30000,
      };

      await amm.previewSwapExactOutputBatch(
        mockAssetOut,
        new BN(1000),
        mockRoutes,
        cacheOptions
      );

      // Verify that getAmountsIn was called with cache options (merged with defaults)
      expect(amm.getAmountsIn).toHaveBeenCalledWith(
        mockAssetOut,
        new BN(1000),
        mockRoutes[0],
        expect.objectContaining(cacheOptions)
      );
      expect(amm.getAmountsIn).toHaveBeenCalledWith(
        mockAssetOut,
        new BN(1000),
        mockRoutes[1],
        expect.objectContaining(cacheOptions)
      );
    });

    it("should work without cache options (backward compatibility)", async () => {
      const result = await amm.previewSwapExactOutputBatch(
        mockAssetOut,
        new BN(1000),
        mockRoutes
      );

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);

      // Verify that getAmountsIn was called with default options (merged with defaults)
      expect(amm.getAmountsIn).toHaveBeenCalledWith(
        mockAssetOut,
        new BN(1000),
        mockRoutes[0],
        expect.objectContaining({
          useCache: true,
          preloadPools: false,
          refreshStaleData: true,
          cacheTTL: 30000,
        })
      );
    });

    it("should handle route failures gracefully", async () => {
      // Mock one route to fail
      (amm.getAmountsIn as jest.Mock)
        .mockResolvedValueOnce([
          [mockAssetOut, new BN(1000)],
          [mockAssetIn, new BN(1050)],
        ])
        .mockRejectedValueOnce(new Error("Route failed"));

      const result = await amm.previewSwapExactOutputBatch(
        mockAssetOut,
        new BN(1000),
        mockRoutes
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual([mockAssetIn, new BN(1050)]);
      expect(result[1]).toBeUndefined();
    });
  });

  describe("Cache integration", () => {
    it("should pass cache options through to underlying methods", async () => {
      // This test verifies that batch preview methods correctly pass cache options
      // to the underlying getAmountsOut/getAmountsIn methods, which handle caching
      // at the poolMetadataBatch level

      const cacheOptions: CacheOptions = {
        useCache: true,
        preloadPools: true,
        cacheTTL: 30000,
      };

      await amm.previewSwapExactInputBatch(
        mockAssetIn,
        new BN(1000),
        mockRoutes,
        cacheOptions
      );

      // Verify that cache options were passed through correctly (merged with defaults)
      expect(amm.getAmountsOut).toHaveBeenCalledWith(
        mockAssetIn,
        new BN(1000),
        mockRoutes[0],
        expect.objectContaining(cacheOptions)
      );
      expect(amm.getAmountsOut).toHaveBeenCalledWith(
        mockAssetIn,
        new BN(1000),
        mockRoutes[1],
        expect.objectContaining(cacheOptions)
      );
    });
  });
});
