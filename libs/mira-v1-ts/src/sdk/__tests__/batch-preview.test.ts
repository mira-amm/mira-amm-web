/**
 * Batch Preview Tests
 * Tests for batch preview methods with cache support
 */

import {BN, AssetId} from "fuels";
import {ReadonlyMiraAmm} from "../readonly_mira_amm";
import {PoolId} from "../model";
import {CacheOptions} from "../cache";
import {vi} from "vitest";

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

describe("Batch Preview Methods with Cache Support", () => {
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
    vi.spyOn(amm, "getAmountsOut").mockResolvedValue([
      [mockAssetIn, new BN(1000)],
      [mockAssetOut, new BN(950)],
    ]);

    vi.spyOn(amm, "getAmountsIn").mockResolvedValue([
      [mockAssetOut, new BN(1000)],
      [mockAssetIn, new BN(1050)],
    ]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
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
        expect.objectContaining({
          useCache: true,
          cacheTTL: 30000,
        })
      );

      expect(amm.getAmountsOut).toHaveBeenCalledWith(
        mockAssetIn,
        new BN(1000),
        mockRoutes[1],
        expect.objectContaining({
          useCache: true,
          cacheTTL: 30000,
        })
      );
    });

    it("should handle failed routes gracefully", async () => {
      // Mock one route to fail
      vi.spyOn(amm, "getAmountsOut")
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
      expect(result[0]).toBeDefined(); // First route succeeded
      expect(result[1]).toBeUndefined(); // Second route failed
    });

    it("should maintain backward compatibility without cache options", async () => {
      const result = await amm.previewSwapExactInputBatch(
        mockAssetIn,
        new BN(1000),
        mockRoutes
      );

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(mockRoutes.length);

      // Should call getAmountsOut with default cache options
      expect(amm.getAmountsOut).toHaveBeenCalledWith(
        mockAssetIn,
        new BN(1000),
        mockRoutes[0],
        expect.objectContaining({
          useCache: true,
        })
      );
    });

    it("should handle empty routes array", async () => {
      const result = await amm.previewSwapExactInputBatch(
        mockAssetIn,
        new BN(1000),
        []
      );

      expect(result).toEqual([]);
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

      // Verify that getAmountsIn was called with cache options
      expect(amm.getAmountsIn).toHaveBeenCalledWith(
        mockAssetOut,
        new BN(1000),
        mockRoutes[0],
        expect.objectContaining({
          useCache: true,
          cacheTTL: 30000,
        })
      );

      expect(amm.getAmountsIn).toHaveBeenCalledWith(
        mockAssetOut,
        new BN(1000),
        mockRoutes[1],
        expect.objectContaining({
          useCache: true,
          cacheTTL: 30000,
        })
      );
    });

    it("should handle failed routes gracefully", async () => {
      // Mock one route to fail
      vi.spyOn(amm, "getAmountsIn")
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
      expect(result[0]).toBeDefined(); // First route succeeded
      expect(result[1]).toBeUndefined(); // Second route failed
    });

    it("should maintain backward compatibility without cache options", async () => {
      const result = await amm.previewSwapExactOutputBatch(
        mockAssetOut,
        new BN(1000),
        mockRoutes
      );

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(mockRoutes.length);

      // Should call getAmountsIn with default cache options
      expect(amm.getAmountsIn).toHaveBeenCalledWith(
        mockAssetOut,
        new BN(1000),
        mockRoutes[0],
        expect.objectContaining({
          useCache: true,
        })
      );
    });

    it("should handle empty routes array", async () => {
      const result = await amm.previewSwapExactOutputBatch(
        mockAssetOut,
        new BN(1000),
        []
      );

      expect(result).toEqual([]);
    });
  });

  describe("Cache Options Integration", () => {
    it("should merge default cache options with provided options", async () => {
      const customOptions: CacheOptions = {
        cacheTTL: 45000,
        refreshStaleData: false,
      };

      await amm.previewSwapExactInputBatch(
        mockAssetIn,
        new BN(1000),
        mockRoutes,
        customOptions
      );

      // Should merge with defaults
      expect(amm.getAmountsOut).toHaveBeenCalledWith(
        mockAssetIn,
        new BN(1000),
        mockRoutes[0],
        expect.objectContaining({
          useCache: true, // default
          cacheTTL: 45000, // custom
          refreshStaleData: false, // custom
        })
      );
    });

    it("should disable caching when useCache is false", async () => {
      const cacheOptions: CacheOptions = {
        useCache: false,
      };

      await amm.previewSwapExactInputBatch(
        mockAssetIn,
        new BN(1000),
        mockRoutes,
        cacheOptions
      );

      expect(amm.getAmountsOut).toHaveBeenCalledWith(
        mockAssetIn,
        new BN(1000),
        mockRoutes[0],
        expect.objectContaining({
          useCache: false,
        })
      );
    });
  });
});
