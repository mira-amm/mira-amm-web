import {describe, it, expect, vi, beforeEach} from "vitest";
import {Provider, BN, AssetId, Address, Account} from "fuels";
import {MiraAmmV2} from "../../mira_amm_v2";
import {ReadonlyMiraAmmV2} from "../../readonly_mira_amm_v2";
import {
  PoolMetadataV2,
  PoolInput,
  LiquidityConfig,
  MiraV2Error,
  PoolCurveStateError,
} from "../../model";

// Mock all dependencies for integration tests
vi.mock("../../errors/v2-errors", () => ({
  withErrorHandling: vi.fn().mockImplementation(async (fn) => fn()),
  createErrorContext: vi.fn().mockReturnValue({}),
  EnhancedMiraV2Error: class MockEnhancedMiraV2Error extends Error {},
}));

vi.mock("../../validation", () => ({
  validatePoolId: vi.fn(),
  validateAssetId: vi.fn(),
  validateSwapParams: vi.fn(),
  validateAddLiquidityParams: vi.fn(),
  validateRemoveLiquidityParams: vi.fn(),
  validatePoolInput: vi.fn(),
  validateBinId: vi.fn(),
  validateAmount: vi.fn(),
  validateDeadline: vi.fn(),
  validateLiquidityConfig: vi.fn(),
  DEFAULT_VALIDATION_OPTIONS: {},
}));

vi.mock("../../cache", () => ({
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

// Mock contract interactions
const mockContractFunctions = {
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
      value: new BN("3000"),
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
  create_pool: vi.fn().mockReturnValue({
    txParams: vi.fn().mockReturnThis(),
    getTransactionRequest: vi.fn().mockResolvedValue({
      addVariableOutputs: vi.fn(),
      addContractInputAndOutput: vi.fn(),
      addResources: vi.fn(),
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
        },
      ],
    }),
  }),
};

vi.mock("../../typegen/contracts-v2", () => ({
  PoolCurveState: vi.fn().mockImplementation(() => ({
    id: {
      toB256: () => "0x1234567890abcdef",
    },
    functions: mockContractFunctions,
  })),
}));

vi.mock("../../typegen/scripts-v2", () => ({
  AddLiquidity: vi.fn().mockImplementation(() => ({
    setConfigurableConstants: vi.fn().mockReturnThis(),
    functions: {
      main: vi.fn().mockReturnValue({
        addContracts: vi.fn().mockReturnThis(),
        txParams: vi.fn().mockReturnThis(),
        getTransactionRequest: vi.fn().mockResolvedValue({
          addVariableOutputs: vi.fn(),
          addContractInputAndOutput: vi.fn(),
          addResources: vi.fn(),
        }),
      }),
    },
  })),
  RemoveLiquidity: vi.fn().mockImplementation(() => ({
    setConfigurableConstants: vi.fn().mockReturnThis(),
    functions: {
      main: vi.fn().mockReturnValue({
        addContracts: vi.fn().mockReturnThis(),
        txParams: vi.fn().mockReturnThis(),
        getTransactionRequest: vi.fn().mockResolvedValue({
          addVariableOutputs: vi.fn(),
          addContractInputAndOutput: vi.fn(),
          addResources: vi.fn(),
        }),
      }),
    },
  })),
  SwapExactIn: vi.fn().mockImplementation(() => ({
    setConfigurableConstants: vi.fn().mockReturnThis(),
    functions: {
      main: vi.fn().mockReturnValue({
        addContracts: vi.fn().mockReturnThis(),
        txParams: vi.fn().mockReturnThis(),
        getTransactionRequest: vi.fn().mockResolvedValue({
          addVariableOutputs: vi.fn(),
          addContractInputAndOutput: vi.fn(),
          addResources: vi.fn(),
        }),
      }),
    },
  })),
  SwapExactOut: vi.fn().mockImplementation(() => ({
    setConfigurableConstants: vi.fn().mockReturnThis(),
    functions: {
      main: vi.fn().mockReturnValue({
        addContracts: vi.fn().mockReturnThis(),
        txParams: vi.fn().mockReturnThis(),
        getTransactionRequest: vi.fn().mockResolvedValue({
          addVariableOutputs: vi.fn(),
          addContractInputAndOutput: vi.fn(),
          addResources: vi.fn(),
        }),
      }),
    },
  })),
}));

describe("Mira v2 Integration Tests", () => {
  let mockProvider: Provider;
  let mockAccount: Account;
  let miraAmmV2: MiraAmmV2;
  let readonlyMiraAmmV2: ReadonlyMiraAmmV2;

  beforeEach(() => {
    // Mock Provider
    mockProvider = {
      getBaseAssetId: vi
        .fn()
        .mockResolvedValue({toString: () => "0xbaseAsset"}),
      getCoins: vi.fn().mockResolvedValue({coins: []}),
    } as any;

    // Mock Account
    mockAccount = {
      address: {toB256: () => "0xuser123"},
      provider: {
        getBaseAssetId: vi
          .fn()
          .mockResolvedValue({toString: () => "0xbaseAsset"}),
        assembleTx: vi.fn().mockResolvedValue({
          assembledRequest: {
            addVariableOutputs: vi.fn(),
            addContractInputAndOutput: vi.fn(),
          },
          gasPrice: new BN(1000),
        }),
        estimateTxDependencies: vi.fn().mockResolvedValue({}),
      },
      getTransactionCost: vi.fn().mockResolvedValue({gasPrice: new BN(1000)}),
      fund: vi.fn().mockResolvedValue({}),
      getResourcesToSpend: vi.fn().mockResolvedValue([]),
    } as any;

    miraAmmV2 = new MiraAmmV2(mockAccount);
    readonlyMiraAmmV2 = new ReadonlyMiraAmmV2(mockProvider);
  });

  describe("End-to-End Pool Creation and Liquidity Flow", () => {
    it("should create pool, add liquidity, and query pool state", async () => {
      const poolInput: PoolInput = {
        assetX: {bits: "0xassetX"} as AssetId,
        assetY: {bits: "0xassetY"} as AssetId,
        binStep: 25,
        baseFactor: 5000,
      };
      const activeId = new BN("8388608");
      const amountADesired = new BN("1000000");
      const amountBDesired = new BN("2000000");
      const deadline = new BN(Date.now() + 3600000);

      // Step 1: Create pool
      const createPoolTx = await miraAmmV2.createPool(poolInput, activeId);
      expect(createPoolTx).toBeDefined();
      expect(createPoolTx.transactionRequest).toBeDefined();
      expect(createPoolTx.gasPrice).toBeDefined();

      // Step 2: Add liquidity to the created pool
      const poolId = new BN("12345"); // Simulated pool ID
      const addLiquidityTx = await miraAmmV2.addLiquidity(
        poolId,
        amountADesired,
        amountBDesired,
        amountADesired.mul(95).div(100), // 5% slippage
        amountBDesired.mul(95).div(100), // 5% slippage
        deadline
      );
      expect(addLiquidityTx).toBeDefined();
      expect(addLiquidityTx.transactionRequest).toBeDefined();

      // Step 3: Query pool metadata
      const poolMetadata = await readonlyMiraAmmV2.poolMetadata(poolId);
      expect(poolMetadata).toBeDefined();
      expect(poolMetadata?.active_id).toBe(8388608);
      expect(poolMetadata?.pool.bin_step).toBe(25);
    });

    it("should create pool and add liquidity in single transaction", async () => {
      const poolInput: PoolInput = {
        assetX: {bits: "0xassetX"} as AssetId,
        assetY: {bits: "0xassetY"} as AssetId,
        binStep: 25,
        baseFactor: 5000,
      };
      const activeId = new BN("8388608");
      const amountADesired = new BN("1000000");
      const amountBDesired = new BN("2000000");
      const deadline = new BN(Date.now() + 3600000);

      const liquidityConfig: LiquidityConfig[] = [
        {binId: 8388607, distributionX: 20, distributionY: 0},
        {binId: 8388608, distributionX: 60, distributionY: 100},
        {binId: 8388609, distributionX: 20, distributionY: 0},
      ];

      const tx = await miraAmmV2.createPoolAndAddLiquidity(
        poolInput,
        activeId,
        amountADesired,
        amountBDesired,
        deadline,
        liquidityConfig
      );

      expect(tx).toBeDefined();
      expect(tx.transactionRequest).toBeDefined();
      expect(tx.gasPrice).toBeDefined();
    });
  });

  describe("Multi-Bin Operations", () => {
    it("should handle liquidity operations across multiple bins", async () => {
      const poolId = new BN("12345");
      const binIds = [new BN("8388607"), new BN("8388608"), new BN("8388609")];

      // Test bin liquidity queries
      for (const binId of binIds) {
        const binLiquidity = await readonlyMiraAmmV2.getBinLiquidity(
          poolId,
          binId
        );
        expect(binLiquidity).toBeDefined();
        expect(binLiquidity?.x).toEqual(new BN("1000000"));
        expect(binLiquidity?.y).toEqual(new BN("2000000"));
      }

      // Test bin range query
      const binRange = await readonlyMiraAmmV2.getBinRange(
        poolId,
        binIds[0],
        binIds[binIds.length - 1]
      );
      expect(binRange).toBeDefined();
      expect(Array.isArray(binRange)).toBe(true);

      // Test remove liquidity from multiple bins
      const removeLiquidityTx = await miraAmmV2.removeLiquidity(
        poolId,
        binIds,
        new BN("950000"), // amountAMin
        new BN("1900000"), // amountBMin
        new BN(Date.now() + 3600000) // deadline
      );

      expect(removeLiquidityTx).toBeDefined();
      expect(removeLiquidityTx.transactionRequest).toBeDefined();
    });

    it("should get comprehensive liquidity distribution", async () => {
      const poolId = new BN("12345");

      const distribution =
        await readonlyMiraAmmV2.getLiquidityDistribution(poolId);

      expect(distribution).toBeDefined();
      expect(distribution.activeBinId).toBe(8388608);
      expect(distribution.totalLiquidity).toBeDefined();
      expect(Array.isArray(distribution.bins)).toBe(true);
    });

    it("should handle user bin positions across multiple bins", async () => {
      const poolId = new BN("12345");
      const userAddress = Address.fromB256(
        "0x0000000000000000000000000000000000000000000000000000000000000001"
      );

      const userPositions = await readonlyMiraAmmV2.getUserBinPositions(
        poolId,
        userAddress
      );

      expect(userPositions).toBeDefined();
      expect(Array.isArray(userPositions)).toBe(true);
    });
  });

  describe("Swap Flow Integration", () => {
    it("should execute complete swap flow with preview", async () => {
      const assetIn: AssetId = {bits: "0xassetIn"} as AssetId;
      const assetOut: AssetId = {bits: "0xassetOut"} as AssetId;
      const amountIn = new BN("1000000");
      const pools = [new BN("12345")];
      const deadline = new BN(Date.now() + 3600000);

      // Step 1: Preview the swap
      const previewResult = await readonlyMiraAmmV2.previewSwapExactInput(
        assetIn,
        amountIn,
        pools
      );
      expect(previewResult).toBeDefined();
      expect(previewResult.assetId).toBeDefined();
      expect(previewResult.amount).toBeDefined();

      // Step 2: Execute the swap with slippage protection
      const minAmountOut = previewResult.amount.mul(95).div(100); // 5% slippage
      const swapTx = await miraAmmV2.swapExactInput(
        amountIn,
        assetIn,
        minAmountOut,
        pools,
        deadline
      );

      expect(swapTx).toBeDefined();
      expect(swapTx.transactionRequest).toBeDefined();
      expect(swapTx.gasPrice).toBeDefined();
    });

    it("should handle multi-hop swaps", async () => {
      const assetIn: AssetId = {bits: "0xassetIn"} as AssetId;
      const amountIn = new BN("1000000");
      const pools = [new BN("12345"), new BN("67890"), new BN("11111")];

      // Test multi-hop amounts calculation
      const amountsOut = await readonlyMiraAmmV2.getAmountsOut(
        assetIn,
        amountIn,
        pools
      );

      expect(amountsOut).toBeDefined();
      expect(Array.isArray(amountsOut)).toBe(true);
      expect(amountsOut.length).toBeGreaterThan(0);

      // Execute multi-hop swap
      const deadline = new BN(Date.now() + 3600000);
      const finalAmountOut = amountsOut[amountsOut.length - 1];
      const minAmountOut = finalAmountOut.amount.mul(95).div(100);

      const swapTx = await miraAmmV2.swapExactInput(
        amountIn,
        assetIn,
        minAmountOut,
        pools,
        deadline
      );

      expect(swapTx).toBeDefined();
      expect(swapTx.transactionRequest).toBeDefined();
    });
  });

  describe("Performance and Batch Operations", () => {
    it("should efficiently handle batch pool metadata queries", async () => {
      const poolIds = [
        new BN("12345"),
        new BN("67890"),
        new BN("11111"),
        new BN("22222"),
        new BN("33333"),
      ];

      const startTime = Date.now();
      const results = await readonlyMiraAmmV2.poolMetadataBatch(poolIds);
      const endTime = Date.now();

      expect(results).toHaveLength(poolIds.length);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second

      // Verify all results are valid
      results.forEach((result, index) => {
        if (result) {
          expect(result.pool).toBeDefined();
          expect(result.active_id).toBeDefined();
        }
      });
    });

    it("should handle batch operations with caching", async () => {
      const poolIds = [new BN("12345"), new BN("67890")];

      // First call - should populate cache
      const firstResults = await readonlyMiraAmmV2.poolMetadataBatch(poolIds);
      expect(firstResults).toHaveLength(2);

      // Second call - should use cache
      const secondResults = await readonlyMiraAmmV2.poolMetadataBatch(poolIds);
      expect(secondResults).toHaveLength(2);

      // Results should be consistent
      expect(firstResults[0]?.pool.bin_step).toBe(
        secondResults[0]?.pool.bin_step
      );
    });

    it("should handle large bin range queries efficiently", async () => {
      const poolId = new BN("12345");
      const startBinId = new BN("8388600");
      const endBinId = new BN("8388620"); // 20 bins

      const startTime = Date.now();
      const binRange = await readonlyMiraAmmV2.getBinRange(
        poolId,
        startBinId,
        endBinId
      );
      const endTime = Date.now();

      expect(binRange).toBeDefined();
      expect(Array.isArray(binRange)).toBe(true);
      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle pool not found gracefully", async () => {
      const nonExistentPoolId = new BN("99999");

      // Mock contract to return null for non-existent pool
      mockContractFunctions.multiCall.mockReturnValueOnce({
        get: vi.fn().mockResolvedValue({
          value: [null],
        }),
      });

      const result = await readonlyMiraAmmV2.poolMetadata(nonExistentPoolId);
      expect(result).toBeNull();
    });

    it("should handle empty bin gracefully", async () => {
      const poolId = new BN("12345");
      const emptyBinId = new BN("8388600");

      // Mock contract to return null for empty bin
      mockContractFunctions.get_bin.mockReturnValueOnce({
        get: vi.fn().mockResolvedValue({value: null}),
      });

      const result = await readonlyMiraAmmV2.getBinLiquidity(
        poolId,
        emptyBinId
      );
      expect(result).toBeNull();
    });

    it("should handle contract errors in batch operations", async () => {
      const poolIds = [new BN("12345"), new BN("67890")];

      // Mock contract to throw error
      mockContractFunctions.multiCall.mockReturnValueOnce({
        get: vi.fn().mockRejectedValue(new Error("Contract error")),
      });

      await expect(
        readonlyMiraAmmV2.poolMetadataBatch(poolIds)
      ).rejects.toThrow();
    });

    it("should validate swap parameters", async () => {
      const assetIn: AssetId = {bits: "0xassetIn"} as AssetId;
      const amountIn = new BN("0"); // Invalid amount
      const pools = [new BN("12345")];
      const deadline = new BN(Date.now() + 3600000);

      // Mock validation to throw for invalid amount
      const {validateSwapParams} = await import("../../validation");
      vi.mocked(validateSwapParams).mockImplementationOnce(() => {
        throw new Error("Amount must be positive");
      });

      await expect(
        miraAmmV2.swapExactInput(
          amountIn,
          assetIn,
          new BN("1000"),
          pools,
          deadline
        )
      ).rejects.toThrow("Amount must be positive");
    });
  });

  describe("Cache Performance", () => {
    it("should demonstrate cache performance benefits", async () => {
      const poolId = new BN("12345");

      // First call - cold cache
      const startTime1 = Date.now();
      const result1 = await readonlyMiraAmmV2.poolMetadata(poolId);
      const endTime1 = Date.now();
      const coldCacheTime = endTime1 - startTime1;

      // Mock cache to return cached data
      const mockCache = readonlyMiraAmmV2["poolCache"];
      mockCache.getPoolMetadata = vi.fn().mockReturnValue({
        metadata: result1,
        timestamp: Date.now(),
      });
      mockCache.isStale = vi.fn().mockReturnValue(false);

      // Second call - warm cache
      const startTime2 = Date.now();
      const result2 = await readonlyMiraAmmV2.poolMetadata(poolId);
      const endTime2 = Date.now();
      const warmCacheTime = endTime2 - startTime2;

      expect(result2).toBeDefined();
      // Warm cache should be faster (though in mocked environment, difference might be minimal)
      expect(warmCacheTime).toBeLessThanOrEqual(coldCacheTime + 10); // Allow some variance
    });
  });
});
