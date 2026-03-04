import {describe, it, expect, vi, beforeEach} from "vitest";
import {Provider, BN, AssetId, Address} from "fuels";
import {ReadonlyMiraAmmV2} from "../readonly_mira_amm_v2";
import {
  PoolMetadataV2,
  AmmMetadataV2,
  LpAssetInfo,
  Amounts,
  BinLiquidityInfo,
  LiquidityDistribution,
  UserBinPosition,
  MiraV2Error,
  PoolCurveStateError,
} from "../model";

// Mock the error handling functions
vi.mock("../errors/v2-errors", () => ({
  withErrorHandling: vi.fn().mockImplementation(async (fn) => fn()),
  createErrorContext: vi.fn().mockReturnValue({}),
  EnhancedMiraV2Error: class MockEnhancedMiraV2Error extends Error {},
}));

// Mock the validation functions
vi.mock("../validation", () => ({
  validatePoolId: vi.fn(),
  validateAssetId: vi.fn(),
  validateBinId: vi.fn(),
}));

// Mock the cache
vi.mock("../cache", () => ({
  DEFAULT_CACHE_OPTIONS: {
    useCache: true,
    refreshStaleData: false,
    cacheTTL: 60000,
  },
  globalPoolDataCacheV2: {
    getPoolMetadata: vi.fn().mockReturnValue(null),
    setPoolMetadata: vi.fn(),
    isStale: vi.fn().mockReturnValue(false),
    getPoolFee: vi.fn().mockReturnValue(null),
    setPoolFee: vi.fn(),
    getBinData: vi.fn().mockReturnValue(null),
    setBinData: vi.fn(),
    getConfig: vi.fn().mockReturnValue({
      preloadActiveBins: true,
      preloadBinRange: 5,
    }),
  },
  PoolDataCacheV2: vi.fn(),
  CacheManagerV2: vi.fn().mockImplementation(() => ({
    preloadPoolsForRoute: vi.fn(),
  })),
}));

// Mock the contract
vi.mock("../typegen/contracts-v2", () => ({
  PoolCurveState: vi.fn().mockImplementation(() => ({
    id: {
      toB256: () => "0x1234567890abcdef",
    },
    functions: {
      get_pool: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({
          value: {
            pool: {
              asset_x: {bits: "0xassetX"},
              asset_y: {bits: "0xassetY"},
              bin_step: 25,
              base_factor: 5000,
            },
            active_id: 8388608,
          },
        }),
      }),
      get_base_fee: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({
          value: new BN("3000"), // 0.3% fee
        }),
      }),
      get_bin: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({
          value: {
            x: new BN("1000000"),
            y: new BN("2000000"),
          },
        }),
      }),
      get_pool_active_bin_id: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({
          value: 8388608,
        }),
      }),
      get_next_non_empty_bin: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({
          value: 8388609,
        }),
      }),
      get_price_from_id: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({
          value: new BN("1000000000000000000"), // 1.0 in 18 decimals
        }),
      }),
      get_hook: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({
          value: {bits: "0xhookAddress"},
        }),
      }),
      total_assets: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({
          value: new BN("100"),
        }),
      }),
      owner: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({
          value: null,
        }),
      }),
      get_fee_recipient: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({
          value: {bits: "0xfeeRecipient"},
        }),
      }),
      get_protocol_fees: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({
          value: new BN("500"), // 0.05%
        }),
      }),
      multiCall: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({
          value: [
            {
              pool: {
                asset_x: {bits: "0xassetX"},
                asset_y: {bits: "0xassetY"},
                bin_step: 25,
                base_factor: 5000,
              },
              active_id: 8388608,
              reserves: {
                x: new BN("1000000"),
                y: new BN("2000000"),
              },
              protocol_fees: {
                x: new BN("1000"),
                y: new BN("2000"),
              },
            },
          ],
        }),
      }),
    },
  })),
}));

describe("ReadonlyMiraAmmV2", () => {
  let mockProvider: Provider;
  let readonlyMiraAmmV2: ReadonlyMiraAmmV2;

  beforeEach(() => {
    // Mock Provider
    mockProvider = {
      getBaseAssetId: vi
        .fn()
        .mockResolvedValue({toString: () => "0xbaseAsset"}),
    } as any;

    readonlyMiraAmmV2 = new ReadonlyMiraAmmV2(mockProvider);

    // Ensure the contract mock is properly applied
    const mockContract = readonlyMiraAmmV2["ammContract"];
    if (!mockContract.multiCall) {
      mockContract.multiCall = vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({
          value: [
            {
              pool: {
                asset_x: {bits: "0xassetX"},
                asset_y: {bits: "0xassetY"},
                bin_step: 25,
                base_factor: 5000,
              },
              active_id: 8388608,
              reserves: {
                x: new BN("1000000"),
                y: new BN("2000000"),
              },
              protocol_fees: {
                x: new BN("1000"),
                y: new BN("2000"),
              },
            },
          ],
        }),
      });
    }
  });

  describe("constructor", () => {
    it("should initialize with default contract ID", () => {
      const readonly = new ReadonlyMiraAmmV2(mockProvider);
      expect(readonly.id()).toBe("0x1234567890abcdef");
    });

    it("should initialize with custom contract ID", () => {
      const customContractId = "0xcustomcontract";
      const readonly = new ReadonlyMiraAmmV2(mockProvider, customContractId);
      expect(readonly.id()).toBe("0x1234567890abcdef");
    });
  });

  describe("poolMetadata", () => {
    it("should successfully get pool metadata for single pool", async () => {
      const poolId = new BN("12345");

      const result = await readonlyMiraAmmV2.poolMetadata(poolId);

      expect(result).toBeDefined();
      expect(result?.pool.asset_x.bits).toBe("0xassetX");
      expect(result?.pool.asset_y.bits).toBe("0xassetY");
      expect(result?.active_id).toBe(8388608);
    });

    it("should return null for non-existent pool", async () => {
      // Mock the contract to return null
      const mockContract = readonlyMiraAmmV2["ammContract"];
      mockContract.functions.multiCall = vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({
          value: [null],
        }),
      });

      const poolId = new BN("99999");
      const result = await readonlyMiraAmmV2.poolMetadata(poolId);

      expect(result).toBeNull();
    });

    it("should use cache when available", async () => {
      const poolId = new BN("12345");
      const cachedMetadata: PoolMetadataV2 = {
        poolId,
        pool: {
          asset_x: {bits: "0xcachedX"} as AssetId,
          asset_y: {bits: "0xcachedY"} as AssetId,
          bin_step: 50,
          base_factor: 6000,
        },
        active_id: 8388600,
        reserves: {x: new BN("500000"), y: new BN("1000000")},
        protocolFees: {x: new BN("1000"), y: new BN("2000")},
      };

      // Mock cache to return cached data
      const mockCache = readonlyMiraAmmV2["poolCache"];
      mockCache.getPoolMetadata = vi.fn().mockReturnValue({
        metadata: cachedMetadata,
        timestamp: Date.now(),
      });
      mockCache.isStale = vi.fn().mockReturnValue(false);

      const result = await readonlyMiraAmmV2.poolMetadata(poolId);

      expect(result).toEqual(cachedMetadata);
      expect(mockCache.getPoolMetadata).toHaveBeenCalledWith(poolId);
    });
  });

  describe("poolMetadataBatch", () => {
    it("should successfully get metadata for multiple pools", async () => {
      const poolIds = [new BN("12345"), new BN("67890")];

      // Mock cache to return no cached data, forcing fresh fetch
      const mockCache = readonlyMiraAmmV2["poolCache"];
      mockCache.getPoolMetadata = vi.fn().mockReturnValue(null);

      // Mock multiCall to return multiple pools
      const mockContract = readonlyMiraAmmV2["ammContract"];
      mockContract.functions.multiCall = vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({
          value: [
            {
              pool: {
                asset_x: {bits: "0xassetX1"},
                asset_y: {bits: "0xassetY1"},
                bin_step: 25,
                base_factor: 5000,
              },
              active_id: 8388608,
            },
            {
              pool: {
                asset_x: {bits: "0xassetX2"},
                asset_y: {bits: "0xassetY2"},
                bin_step: 50,
                base_factor: 6000,
              },
              active_id: 8388610,
            },
          ],
        }),
      });

      const results = await readonlyMiraAmmV2.poolMetadataBatch(poolIds);

      expect(results).toHaveLength(2);
      expect(results[0]?.pool.asset_x.bits).toBe("0xassetX1");
      expect(results[1]?.pool.asset_x.bits).toBe("0xassetX2");
    });

    it("should handle mixed results with some null pools", async () => {
      const poolIds = [new BN("12345"), new BN("99999")];

      // Mock cache to return no cached data, forcing fresh fetch
      const mockCache = readonlyMiraAmmV2["poolCache"];
      mockCache.getPoolMetadata = vi.fn().mockReturnValue(null);

      // Mock multiCall to return one valid pool and one null
      const mockContract = readonlyMiraAmmV2["ammContract"];
      mockContract.functions.multiCall = vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({
          value: [
            {
              pool: {
                asset_x: {bits: "0xassetX"},
                asset_y: {bits: "0xassetY"},
                bin_step: 25,
                base_factor: 5000,
              },
              active_id: 8388608,
            },
            null,
          ],
        }),
      });

      const results = await readonlyMiraAmmV2.poolMetadataBatch(poolIds);

      expect(results).toHaveLength(2);
      expect(results[0]).toBeDefined();
      expect(results[1]).toBeNull();
    });

    it("should bypass cache when useCache is false", async () => {
      const poolIds = [new BN("12345")];
      const options = {useCache: false};

      const result = await readonlyMiraAmmV2.poolMetadataBatch(
        poolIds,
        options
      );

      expect(result).toHaveLength(1);
      // Verify cache was not checked
      const mockCache = readonlyMiraAmmV2["poolCache"];
      expect(mockCache.getPoolMetadata).not.toHaveBeenCalled();
    });
  });

  describe("fees", () => {
    it("should successfully get pool fees", async () => {
      const poolId = new BN("12345");

      const result = await readonlyMiraAmmV2.fees(poolId);

      expect(result).toEqual(new BN("3000"));
    });

    it("should use cached fees when available", async () => {
      const poolId = new BN("12345");
      const cachedFee = new BN("2500");

      // Mock cache to return cached fee as BN
      const mockCache = readonlyMiraAmmV2["poolCache"];
      mockCache.getPoolFee = vi.fn().mockReturnValue(cachedFee);

      const result = await readonlyMiraAmmV2.fees(poolId);

      expect(result.toString()).toEqual(cachedFee.toString());
      expect(mockCache.getPoolFee).toHaveBeenCalledWith(poolId);
    });

    it("should handle contract errors gracefully", async () => {
      const poolId = new BN("12345");

      // Clear cache to ensure contract call is made
      const mockCache = readonlyMiraAmmV2["poolCache"];
      mockCache.getPoolFee = vi.fn().mockReturnValue(null);

      // Mock contract to throw error
      const mockContract = readonlyMiraAmmV2["ammContract"];
      mockContract.functions.get_base_fee = vi.fn().mockReturnValue({
        get: vi.fn().mockRejectedValue(new Error("Contract error")),
      });

      await expect(readonlyMiraAmmV2.fees(poolId)).rejects.toThrow();
    });
  });

  describe("ammMetadata", () => {
    it("should successfully get AMM metadata", async () => {
      const result = await readonlyMiraAmmV2.ammMetadata();

      expect(result).toBeDefined();
      expect(result.id).toBe("0x1234567890abcdef");
    });
  });

  describe("lpAssetInfo", () => {
    it("should successfully get LP asset info", async () => {
      const assetId: AssetId = {bits: "0xlpAsset"} as AssetId;

      // Mock the provider calls for asset info
      const mockProvider = readonlyMiraAmmV2.provider;
      mockProvider.getCoins = vi.fn().mockResolvedValue({
        coins: [{amount: new BN("1000000")}],
      });

      const result = await readonlyMiraAmmV2.lpAssetInfo(assetId);

      expect(result).toBeDefined();
    });

    it("should return null for non-existent LP asset", async () => {
      const assetId: AssetId = {bits: "0xnonexistent"} as AssetId;

      // Mock the provider to return empty results
      const mockProvider = readonlyMiraAmmV2.provider;
      mockProvider.getCoins = vi.fn().mockResolvedValue({coins: []});

      const result = await readonlyMiraAmmV2.lpAssetInfo(assetId);

      expect(result).toBeNull();
    });
  });

  describe("bin operations", () => {
    describe("getBinLiquidity", () => {
      it("should successfully get bin liquidity", async () => {
        const poolId = new BN("12345");
        const binId = new BN("8388608");

        const result = await readonlyMiraAmmV2.getBinLiquidity(poolId, binId);

        expect(result).toBeDefined();
        expect(result?.x).toEqual(new BN("1000000"));
        expect(result?.y).toEqual(new BN("2000000"));
      });

      it("should return null for empty bin", async () => {
        const poolId = new BN("12345");
        const binId = new BN("8388600");

        // Mock contract to return null for empty bin
        const mockContract = readonlyMiraAmmV2["ammContract"];
        mockContract.functions.get_bin = vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({value: null}),
        });

        const result = await readonlyMiraAmmV2.getBinLiquidity(poolId, binId);

        expect(result).toBeNull();
      });
    });

    describe("getActiveBin", () => {
      it("should successfully get active bin ID", async () => {
        const poolId = new BN("12345");

        const result = await readonlyMiraAmmV2.getActiveBin(poolId);

        expect(result).toBe(8388608);
      });

      it("should return null for pool without active bin", async () => {
        const poolId = new BN("99999");

        // Mock contract to return null
        const mockContract = readonlyMiraAmmV2["ammContract"];
        mockContract.functions.get_pool_active_bin_id = vi
          .fn()
          .mockReturnValue({
            get: vi.fn().mockResolvedValue({value: null}),
          });

        const result = await readonlyMiraAmmV2.getActiveBin(poolId);

        expect(result).toBeNull();
      });
    });

    describe("getBinRange", () => {
      it("should successfully get bin range", async () => {
        const poolId = new BN("12345");
        const startBinId = new BN("8388607");
        const endBinId = new BN("8388609");

        const result = await readonlyMiraAmmV2.getBinRange(
          poolId,
          startBinId,
          endBinId
        );

        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
      });
    });

    describe("getLiquidityDistribution", () => {
      it("should successfully get liquidity distribution", async () => {
        const poolId = new BN("12345");

        const result = await readonlyMiraAmmV2.getLiquidityDistribution(poolId);

        expect(result).toBeDefined();
        expect(result.activeBinId).toBe(8388608);
        expect(result.totalLiquidity).toBeDefined();
        expect(Array.isArray(result.bins)).toBe(true);
      });
    });

    describe("getBinReserves", () => {
      it("should successfully get bin reserves", async () => {
        const poolId = new BN("12345");
        const binId = new BN("8388608");

        const result = await readonlyMiraAmmV2.getBinReserves(poolId, binId);

        expect(result).toBeDefined();
        expect(result?.x).toEqual(new BN("1000000"));
        expect(result?.y).toEqual(new BN("2000000"));
      });
    });

    describe("getUserBinPositions", () => {
      it("should successfully get user bin positions", async () => {
        const poolId = new BN("12345");
        const userAddress = Address.fromB256(
          "0x0000000000000000000000000000000000000000000000000000000000000001"
        );

        const result = await readonlyMiraAmmV2.getUserBinPositions(
          poolId,
          userAddress
        );

        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
      });
    });
  });

  describe("swap preview operations", () => {
    const mockAssetIn: AssetId = {bits: "0xassetIn"} as AssetId;
    const mockAssetOut: AssetId = {bits: "0xassetOut"} as AssetId;

    describe("previewSwapExactInput", () => {
      it("should successfully preview swap exact input", async () => {
        const assetAmountIn = new BN("1000000");
        const pools = [new BN("12345")];

        const result = await readonlyMiraAmmV2.previewSwapExactInput(
          mockAssetIn,
          assetAmountIn,
          pools
        );

        expect(result).toBeDefined();
        expect(result.assetId).toBeDefined();
        expect(result.amount).toBeDefined();
      });

      it("should handle empty pools array", async () => {
        const assetAmountIn = new BN("1000000");
        const pools: BN[] = [];

        await expect(
          readonlyMiraAmmV2.previewSwapExactInput(
            mockAssetIn,
            assetAmountIn,
            pools
          )
        ).rejects.toThrow();
      });
    });

    describe("previewSwapExactOutput", () => {
      it("should successfully preview swap exact output", async () => {
        const assetAmountOut = new BN("1000000");
        const pools = [new BN("12345")];

        const result = await readonlyMiraAmmV2.previewSwapExactOutput(
          mockAssetOut,
          assetAmountOut,
          pools
        );

        expect(result).toBeDefined();
        expect(result.assetId).toBeDefined();
        expect(result.amount).toBeDefined();
      });
    });

    describe("getAmountsOut", () => {
      it("should successfully get amounts out for multi-hop", async () => {
        const assetAmountIn = new BN("1000000");
        const pools = [new BN("12345"), new BN("67890")];

        const result = await readonlyMiraAmmV2.getAmountsOut(
          mockAssetIn,
          assetAmountIn,
          pools
        );

        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
      });
    });

    describe("getAmountsIn", () => {
      it("should successfully get amounts in for multi-hop", async () => {
        const assetAmountOut = new BN("1000000");
        const pools = [new BN("12345"), new BN("67890")];

        const result = await readonlyMiraAmmV2.getAmountsIn(
          mockAssetOut,
          assetAmountOut,
          pools
        );

        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
      });
    });
  });

  describe("position management", () => {
    describe("getOtherTokenToAddLiquidity", () => {
      it("should successfully calculate other token amount", async () => {
        const poolId = new BN("12345");
        const amount = new BN("1000000");
        const isFirstToken = true;

        const result = await readonlyMiraAmmV2.getOtherTokenToAddLiquidity(
          poolId,
          amount,
          isFirstToken
        );

        expect(result).toBeDefined();
        expect(result.assetId).toBeDefined();
        expect(result.amount).toBeDefined();
      });

      it("should handle pool not found", async () => {
        const poolId = new BN("99999");
        const amount = new BN("1000000");
        const isFirstToken = true;

        // Mock pool metadata to return null
        vi.spyOn(readonlyMiraAmmV2, "poolMetadata").mockResolvedValue(null);

        await expect(
          readonlyMiraAmmV2.getOtherTokenToAddLiquidity(
            poolId,
            amount,
            isFirstToken
          )
        ).rejects.toThrow();
      });
    });

    describe("getLiquidityPosition", () => {
      it("should successfully get liquidity position", async () => {
        const poolId = new BN("12345");
        const lpTokensAmount = new BN("1000000");

        const result = await readonlyMiraAmmV2.getLiquidityPosition(
          poolId,
          lpTokensAmount
        );

        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(2);
      });

      it("should handle zero LP tokens", async () => {
        const poolId = new BN("12345");
        const lpTokensAmount = new BN("0");

        await expect(
          readonlyMiraAmmV2.getLiquidityPosition(poolId, lpTokensAmount)
        ).rejects.toThrow();
      });
    });
  });

  describe("utility methods", () => {
    describe("getPoolReserves", () => {
      it("should successfully get total pool reserves", async () => {
        const poolId = new BN("12345");

        const result = await readonlyMiraAmmV2.getPoolReserves(poolId);

        expect(result).toBeDefined();
        expect(result.x).toBeDefined();
        expect(result.y).toBeDefined();
      });
    });

    describe("getPriceFromId", () => {
      it("should successfully get price from bin ID", async () => {
        const poolId = new BN("12345");
        const binId = new BN("8388608");

        const result = await readonlyMiraAmmV2.getPriceFromId(poolId, binId);

        expect(result).toBeDefined();
        expect(result).toEqual(new BN("1000000000000000000"));
      });
    });

    describe("getNextNonEmptyBin", () => {
      it("should successfully get next non-empty bin", async () => {
        const poolId = new BN("12345");
        const swapForY = true;
        const binId = new BN("8388608");

        const result = await readonlyMiraAmmV2.getNextNonEmptyBin(
          poolId,
          swapForY,
          binId
        );

        expect(result).toBe(8388609);
      });
    });
  });

  describe("error handling", () => {
    it("should handle contract call failures gracefully", async () => {
      const poolId = new BN("12345");

      // Mock cache to return no cached data
      const mockCache = readonlyMiraAmmV2["poolCache"];
      mockCache.getPoolMetadata = vi.fn().mockReturnValue(null);

      // Mock contract to throw error
      const mockContract = readonlyMiraAmmV2["ammContract"];
      mockContract.functions.multiCall = vi.fn().mockReturnValue({
        get: vi.fn().mockRejectedValue(new Error("Contract call failed")),
      });

      await expect(readonlyMiraAmmV2.poolMetadata(poolId)).rejects.toThrow();
    });

    it("should validate input parameters", async () => {
      const invalidPoolId = new BN("-1");

      // Mock validation to throw
      const {validatePoolId} = await import("../validation");
      vi.mocked(validatePoolId).mockImplementationOnce(() => {
        throw new Error("Invalid pool ID");
      });

      await expect(
        readonlyMiraAmmV2.poolMetadata(invalidPoolId)
      ).rejects.toThrow("Invalid pool ID");
    });
  });

  describe("caching behavior", () => {
    it("should refresh stale data when refreshStaleData is true", async () => {
      const poolId = new BN("12345");
      const options = {refreshStaleData: true};

      // Mock cache to return stale data
      const mockCache = readonlyMiraAmmV2["poolCache"];
      mockCache.getPoolMetadata = vi.fn().mockReturnValue({
        metadata: {poolId} as PoolMetadataV2,
        timestamp: Date.now() - 120000, // 2 minutes ago
      });
      mockCache.isStale = vi.fn().mockReturnValue(true);

      const result = await readonlyMiraAmmV2.poolMetadata(poolId, options);

      expect(result).toBeDefined();
      expect(mockCache.setPoolMetadata).toHaveBeenCalled();
    });

    it("should use stale data when refreshStaleData is false", async () => {
      const poolId = new BN("12345");
      const options = {refreshStaleData: false};
      const staleMetadata: PoolMetadataV2 = {
        poolId,
        pool: {
          asset_x: {bits: "0xstaleX"} as AssetId,
          asset_y: {bits: "0xstaleY"} as AssetId,
          bin_step: 25,
          base_factor: 5000,
        },
        active_id: 8388608,
        reserves: {x: new BN("100"), y: new BN("200")},
        protocolFees: {x: new BN("1"), y: new BN("2")},
      };

      // Mock cache to return stale data
      const mockCache = readonlyMiraAmmV2["poolCache"];
      mockCache.getPoolMetadata = vi.fn().mockReturnValue({
        metadata: staleMetadata,
        timestamp: Date.now() - 120000, // 2 minutes ago
      });
      mockCache.isStale = vi.fn().mockReturnValue(true);

      const result = await readonlyMiraAmmV2.poolMetadata(poolId, options);

      expect(result).toEqual(staleMetadata);
      // Should not fetch fresh data
      expect(mockCache.setPoolMetadata).not.toHaveBeenCalled();
    });
  });
});
