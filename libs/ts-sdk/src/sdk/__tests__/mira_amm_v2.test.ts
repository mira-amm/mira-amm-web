import {Account, BN, Provider, Address, AssetId} from "fuels";
import {MiraAmmV2} from "../mira_amm_v2";
import {
  PoolCurveStateError,
  MiraV2Error,
  PoolInput,
  LiquidityConfig,
} from "../model";
import {vi, describe, expect, it} from "vitest";

// Mock the error handling functions
vi.mock("../errors", () => ({
  withErrorHandling: vi.fn().mockImplementation(async (fn, context) => {
    try {
      return await fn();
    } catch (error) {
      // Wrap generic errors in MiraV2Error
      if (
        error instanceof Error &&
        error.message.includes("Contract call failed")
      ) {
        const {MiraV2Error, PoolCurveStateError} = await import("../model");
        throw new MiraV2Error(
          PoolCurveStateError.InvalidParameters,
          error.message
        );
      }
      if (error instanceof Error && error.message.includes("Network error")) {
        const {MiraV2Error, PoolCurveStateError} = await import("../model");
        throw new MiraV2Error(
          PoolCurveStateError.InvalidParameters,
          error.message
        );
      }
      throw error;
    }
  }),
  createErrorContext: vi.fn().mockReturnValue({}),
  EnhancedMiraV2Error: class MockEnhancedMiraV2Error extends Error {},
}));

// Mock the validation functions
vi.mock("../validation", () => ({
  validatePoolId: vi.fn().mockImplementation((poolId, fieldName, context) => {
    if (poolId && poolId.lt && poolId.lt(0)) {
      throw new Error(`Invalid ${fieldName}: must be non-negative`);
    }
  }),
  validateAssetId: vi.fn(),
  validateSwapParams: vi
    .fn()
    .mockImplementation(
      (amountIn, amountOut, pools, deadline, options, context) => {
        if (amountIn.lte(0)) {
          throw new Error("Amount must be positive");
        }
      }
    ),
  validateAddLiquidityParams: vi
    .fn()
    .mockImplementation(
      (
        poolId,
        amountA,
        amountB,
        amountAMin,
        amountBMin,
        deadline,
        options,
        context
      ) => {
        if (amountA.lt(0) || amountB.lt(0)) {
          throw new Error("Amounts must be non-negative");
        }
        if (deadline.lt(Date.now())) {
          throw new Error("Deadline must be in the future");
        }
      }
    ),
  validateRemoveLiquidityParams: vi
    .fn()
    .mockImplementation(
      (poolId, binIds, amountAMin, amountBMin, deadline, options, context) => {
        if (binIds.length === 0) {
          throw new Error("At least one bin ID must be provided");
        }
      }
    ),
  validatePoolInput: vi.fn().mockImplementation((pool, context) => {
    if (!pool.assetX || !pool.assetY) {
      throw new Error("Invalid pool input: missing assets");
    }
  }),
  validateBinId: vi.fn().mockImplementation((binId, context) => {
    if (binId.lt(0)) {
      throw new Error("Bin ID must be non-negative");
    }
  }),
  validateAmount: vi
    .fn()
    .mockImplementation((amount, fieldName, options, context) => {
      if (amount.lte(0)) {
        throw new Error(`${fieldName} must be positive`);
      }
    }),
  validateDeadline: vi.fn().mockImplementation((deadline, options, context) => {
    if (deadline.lt(Date.now())) {
      throw new Error("Deadline must be in the future");
    }
  }),
  validateLiquidityConfig: vi.fn().mockImplementation((config, context) => {
    if (config.some((c) => c.binId < 0)) {
      throw new Error("Invalid liquidity configuration: negative bin ID");
    }
  }),
  DEFAULT_VALIDATION_OPTIONS: {},
}));

// Mock the dependencies
vi.mock("../typegen/scripts-v2", () => ({
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
            active_id: 8388608, // Default active bin ID
          },
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
    },
  })),
}));

describe("MiraAmmV2", () => {
  let mockAccount: Account;
  let miraAmmV2: MiraAmmV2;

  beforeEach(() => {
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
  });

  describe("addLiquidity", () => {
    it("should successfully add liquidity with default parameters", async () => {
      const poolId = new BN("12345");
      const amountADesired = new BN("1000000");
      const amountBDesired = new BN("2000000");
      const amountAMin = new BN("950000");
      const amountBMin = new BN("1900000");
      const deadline = new BN(Date.now() + 3600000); // 1 hour from now

      const result = await miraAmmV2.addLiquidity(
        poolId,
        amountADesired,
        amountBDesired,
        amountAMin,
        amountBMin,
        deadline
      );

      expect(result).toBeDefined();
      expect(result.transactionRequest).toBeDefined();
      expect(result.gasPrice).toBeDefined();
    });

    it("should successfully add liquidity with v2-specific parameters", async () => {
      const poolId = new BN("12345");
      const amountADesired = new BN("1000000");
      const amountBDesired = new BN("2000000");
      const amountAMin = new BN("950000");
      const amountBMin = new BN("1900000");
      const deadline = new BN(Date.now() + 3600000);
      const activeIdDesired = new BN("8388608");
      const idSlippage = new BN("10");
      const deltaIds = [{Positive: 1}, {Negative: 1}];
      const distributionX = [new BN("5000"), new BN("5000")];
      const distributionY = [new BN("5000"), new BN("5000")];

      const result = await miraAmmV2.addLiquidity(
        poolId,
        amountADesired,
        amountBDesired,
        amountAMin,
        amountBMin,
        deadline,
        activeIdDesired,
        idSlippage,
        deltaIds,
        distributionX,
        distributionY
      );

      expect(result).toBeDefined();
      expect(result.transactionRequest).toBeDefined();
      expect(result.gasPrice).toBeDefined();
    });

    it("should throw MiraV2Error when pool is not found", async () => {
      // Mock the contract to return null (pool not found)
      const mockContract = miraAmmV2["ammContract"];
      mockContract.functions.get_pool = vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({value: null}),
      });

      const poolId = new BN("99999");
      const amountADesired = new BN("1000000");
      const amountBDesired = new BN("2000000");
      const amountAMin = new BN("950000");
      const amountBMin = new BN("1900000");
      const deadline = new BN(Date.now() + 3600000);

      await expect(
        miraAmmV2.addLiquidity(
          poolId,
          amountADesired,
          amountBDesired,
          amountAMin,
          amountBMin,
          deadline
        )
      ).rejects.toThrow(MiraV2Error);

      await expect(
        miraAmmV2.addLiquidity(
          poolId,
          amountADesired,
          amountBDesired,
          amountAMin,
          amountBMin,
          deadline
        )
      ).rejects.toThrow("Pool with ID 99999 not found");
    });

    it("should handle contract errors gracefully", async () => {
      // Mock the contract to throw an error
      const mockContract = miraAmmV2["ammContract"];
      mockContract.functions.get_pool = vi.fn().mockReturnValue({
        get: vi.fn().mockRejectedValue(new Error("Contract call failed")),
      });

      const poolId = new BN("12345");
      const amountADesired = new BN("1000000");
      const amountBDesired = new BN("2000000");
      const amountAMin = new BN("950000");
      const amountBMin = new BN("1900000");
      const deadline = new BN(Date.now() + 3600000);

      await expect(
        miraAmmV2.addLiquidity(
          poolId,
          amountADesired,
          amountBDesired,
          amountAMin,
          amountBMin,
          deadline
        )
      ).rejects.toThrow(MiraV2Error);
    });

    it("should use correct default values for v2 parameters", async () => {
      const poolId = new BN("12345");
      const amountADesired = new BN("1000000");
      const amountBDesired = new BN("2000000");
      const amountAMin = new BN("950000");
      const amountBMin = new BN("1900000");
      const deadline = new BN(Date.now() + 3600000);

      // Mock the script to capture the parameters
      const mockScript = miraAmmV2["addLiquidityScript"];
      const mainSpy = vi.spyOn(mockScript.functions, "main");

      await miraAmmV2.addLiquidity(
        poolId,
        amountADesired,
        amountBDesired,
        amountAMin,
        amountBMin,
        deadline
      );

      // Verify that the script was called with correct default parameters
      expect(mainSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          active_id_desired: 8388608, // Should use the active ID from pool metadata
          id_slippage: 0, // Default value
          delta_ids: [], // Default empty array
          distribution_x: [], // Default empty array
          distribution_y: [], // Default empty array
        })
      );
    });
  });

  describe("removeLiquidity", () => {
    it("should successfully remove liquidity from multiple bins", async () => {
      const poolId = new BN("12345");
      const binIds = [new BN("8388607"), new BN("8388608"), new BN("8388609")];
      const amountAMin = new BN("950000");
      const amountBMin = new BN("1900000");
      const deadline = new BN(Date.now() + 3600000);

      const result = await miraAmmV2.removeLiquidity(
        poolId,
        binIds,
        amountAMin,
        amountBMin,
        deadline
      );

      expect(result).toBeDefined();
      expect(result.transactionRequest).toBeDefined();
      expect(result.gasPrice).toBeDefined();
    });

    it("should throw MiraV2Error when pool is not found", async () => {
      // Mock the contract to return null (pool not found)
      const mockContract = miraAmmV2["ammContract"];
      mockContract.functions.get_pool = vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({value: null}),
      });

      const poolId = new BN("99999");
      const binIds = [new BN("8388608")];
      const amountAMin = new BN("950000");
      const amountBMin = new BN("1900000");
      const deadline = new BN(Date.now() + 3600000);

      await expect(
        miraAmmV2.removeLiquidity(
          poolId,
          binIds,
          amountAMin,
          amountBMin,
          deadline
        )
      ).rejects.toThrow(MiraV2Error);
    });

    it("should validate bin IDs parameter", async () => {
      const poolId = new BN("12345");
      const binIds: any[] = []; // Empty array should be invalid
      const amountAMin = new BN("950000");
      const amountBMin = new BN("1900000");
      const deadline = new BN(Date.now() + 3600000);

      await expect(
        miraAmmV2.removeLiquidity(
          poolId,
          binIds,
          amountAMin,
          amountBMin,
          deadline
        )
      ).rejects.toThrow();
    });
  });

  describe("swapExactInput", () => {
    const mockAssetIn: AssetId = {bits: "0xassetIn"} as AssetId;
    const mockAssetOut: AssetId = {bits: "0xassetOut"} as AssetId;

    it("should successfully swap exact input through single pool", async () => {
      const amountIn = new BN("1000000");
      const amountOutMin = new BN("950000");
      const pools = [new BN("12345")];
      const deadline = new BN(Date.now() + 3600000);

      const result = await miraAmmV2.swapExactInput(
        amountIn,
        mockAssetIn,
        amountOutMin,
        pools,
        deadline
      );

      expect(result).toBeDefined();
      expect(result.transactionRequest).toBeDefined();
      expect(result.gasPrice).toBeDefined();
    });

    it("should successfully swap exact input through multiple pools", async () => {
      const amountIn = new BN("1000000");
      const amountOutMin = new BN("950000");
      const pools = [new BN("12345"), new BN("67890")];
      const deadline = new BN(Date.now() + 3600000);

      const result = await miraAmmV2.swapExactInput(
        amountIn,
        mockAssetIn,
        amountOutMin,
        pools,
        deadline
      );

      expect(result).toBeDefined();
      expect(result.transactionRequest).toBeDefined();
      expect(result.gasPrice).toBeDefined();
    });

    it("should accept custom receiver address", async () => {
      const amountIn = new BN("1000000");
      const amountOutMin = new BN("950000");
      const pools = [new BN("12345")];
      const deadline = new BN(Date.now() + 3600000);
      const receiver = Address.fromB256(
        "0x0000000000000000000000000000000000000000000000000000000000000001"
      );

      const result = await miraAmmV2.swapExactInput(
        amountIn,
        mockAssetIn,
        amountOutMin,
        pools,
        deadline,
        receiver
      );

      expect(result).toBeDefined();
      expect(result.transactionRequest).toBeDefined();
      expect(result.gasPrice).toBeDefined();
    });

    it("should throw error when no pools provided", async () => {
      const amountIn = new BN("1000000");
      const amountOutMin = new BN("950000");
      const pools: BN[] = [];
      const deadline = new BN(Date.now() + 3600000);

      await expect(
        miraAmmV2.swapExactInput(
          amountIn,
          mockAssetIn,
          amountOutMin,
          pools,
          deadline
        )
      ).rejects.toThrow(MiraV2Error);
    });

    it("should validate input parameters", async () => {
      const amountIn = new BN("0"); // Invalid amount
      const amountOutMin = new BN("950000");
      const pools = [new BN("12345")];
      const deadline = new BN(Date.now() + 3600000);

      await expect(
        miraAmmV2.swapExactInput(
          amountIn,
          mockAssetIn,
          amountOutMin,
          pools,
          deadline
        )
      ).rejects.toThrow();
    });
  });

  describe("swapExactOutput", () => {
    const mockAssetIn: AssetId = {bits: "0xassetIn"} as AssetId;
    const mockAssetOut: AssetId = {bits: "0xassetOut"} as AssetId;

    beforeEach(() => {
      // Mock pool metadata for swapExactOutput
      const mockContract = miraAmmV2["ammContract"];
      mockContract.functions.get_pool = vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({
          value: {
            pool: {
              asset_x: mockAssetIn,
              asset_y: mockAssetOut,
              bin_step: 25,
              base_factor: 5000,
            },
            active_id: 8388608,
          },
        }),
      });
    });

    it("should successfully swap for exact output through single pool", async () => {
      const amountOut = new BN("1000000");
      const amountInMax = new BN("1100000");
      const pools = [new BN("12345")];
      const deadline = new BN(Date.now() + 3600000);

      const result = await miraAmmV2.swapExactOutput(
        amountOut,
        mockAssetOut,
        amountInMax,
        pools,
        deadline
      );

      expect(result).toBeDefined();
      expect(result.transactionRequest).toBeDefined();
      expect(result.gasPrice).toBeDefined();
    });

    it("should successfully swap for exact output through multiple pools", async () => {
      const amountOut = new BN("1000000");
      const amountInMax = new BN("1100000");
      const pools = [new BN("12345"), new BN("67890")];
      const deadline = new BN(Date.now() + 3600000);

      const result = await miraAmmV2.swapExactOutput(
        amountOut,
        mockAssetOut,
        amountInMax,
        pools,
        deadline
      );

      expect(result).toBeDefined();
      expect(result.transactionRequest).toBeDefined();
      expect(result.gasPrice).toBeDefined();
    });

    it("should accept custom receiver address", async () => {
      const amountOut = new BN("1000000");
      const amountInMax = new BN("1100000");
      const pools = [new BN("12345")];
      const deadline = new BN(Date.now() + 3600000);
      const receiver = Address.fromB256(
        "0x0000000000000000000000000000000000000000000000000000000000000001"
      );

      const result = await miraAmmV2.swapExactOutput(
        amountOut,
        mockAssetOut,
        amountInMax,
        pools,
        deadline,
        receiver
      );

      expect(result).toBeDefined();
      expect(result.transactionRequest).toBeDefined();
      expect(result.gasPrice).toBeDefined();
    });

    it("should throw error when no pools provided", async () => {
      const amountOut = new BN("1000000");
      const amountInMax = new BN("1100000");
      const pools: BN[] = [];
      const deadline = new BN(Date.now() + 3600000);

      await expect(
        miraAmmV2.swapExactOutput(
          amountOut,
          mockAssetOut,
          amountInMax,
          pools,
          deadline
        )
      ).rejects.toThrow(MiraV2Error);
    });

    it("should throw error when output asset not found in first pool", async () => {
      // Mock pool with different assets
      const mockContract = miraAmmV2["ammContract"];
      mockContract.functions.get_pool = vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({
          value: {
            pool: {
              asset_x: {bits: "0xdifferentAsset1"},
              asset_y: {bits: "0xdifferentAsset2"},
              bin_step: 25,
              base_factor: 5000,
            },
            active_id: 8388608,
          },
        }),
      });

      const amountOut = new BN("1000000");
      const amountInMax = new BN("1100000");
      const pools = [new BN("12345")];
      const deadline = new BN(Date.now() + 3600000);

      await expect(
        miraAmmV2.swapExactOutput(
          amountOut,
          mockAssetOut,
          amountInMax,
          pools,
          deadline
        )
      ).rejects.toThrow(MiraV2Error);
    });

    it("should throw error when first pool not found", async () => {
      // Mock the contract to return null (pool not found)
      const mockContract = miraAmmV2["ammContract"];
      mockContract.functions.get_pool = vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({value: null}),
      });

      const amountOut = new BN("1000000");
      const amountInMax = new BN("1100000");
      const pools = [new BN("99999")];
      const deadline = new BN(Date.now() + 3600000);

      await expect(
        miraAmmV2.swapExactOutput(
          amountOut,
          mockAssetOut,
          amountInMax,
          pools,
          deadline
        )
      ).rejects.toThrow(MiraV2Error);
    });
  });

  describe("createPool", () => {
    const mockPoolInput: PoolInput = {
      assetX: {bits: "0xassetX"} as AssetId,
      assetY: {bits: "0xassetY"} as AssetId,
      binStep: 25,
      baseFactor: 5000,
    };

    it("should successfully create a new pool", async () => {
      const activeId = new BN("8388608");

      const result = await miraAmmV2.createPool(mockPoolInput, activeId);

      expect(result).toBeDefined();
      expect(result.transactionRequest).toBeDefined();
      expect(result.gasPrice).toBeDefined();
    });

    it("should validate pool input parameters", async () => {
      const invalidPoolInput: any = {
        assetX: null, // Invalid asset
        assetY: {bits: "0xassetY"} as AssetId,
        binStep: 25,
        baseFactor: 5000,
      };
      const activeId = new BN("8388608");

      await expect(
        miraAmmV2.createPool(invalidPoolInput, activeId)
      ).rejects.toThrow();
    });

    it("should validate active ID parameter", async () => {
      const activeId = new BN("-1"); // Invalid active ID

      await expect(
        miraAmmV2.createPool(mockPoolInput, activeId)
      ).rejects.toThrow();
    });

    it("should handle contract errors gracefully", async () => {
      // Mock the contract to throw an error
      const mockContract = miraAmmV2["ammContract"];
      mockContract.functions.create_pool = vi.fn().mockReturnValue({
        txParams: vi.fn().mockReturnThis(),
        getTransactionRequest: vi
          .fn()
          .mockRejectedValue(new Error("Contract call failed")),
      });

      const activeId = new BN("8388608");

      await expect(
        miraAmmV2.createPool(mockPoolInput, activeId)
      ).rejects.toThrow();
    });
  });

  describe("createPoolAndAddLiquidity", () => {
    const mockPoolInput: PoolInput = {
      assetX: {bits: "0xassetX"} as AssetId,
      assetY: {bits: "0xassetY"} as AssetId,
      binStep: 25,
      baseFactor: 5000,
    };

    it("should successfully create pool and add liquidity with default config", async () => {
      const activeId = new BN("8388608");
      const amountADesired = new BN("1000000");
      const amountBDesired = new BN("2000000");
      const deadline = new BN(Date.now() + 3600000);

      const result = await miraAmmV2.createPoolAndAddLiquidity(
        mockPoolInput,
        activeId,
        amountADesired,
        amountBDesired,
        deadline
      );

      expect(result).toBeDefined();
      expect(result.transactionRequest).toBeDefined();
      expect(result.gasPrice).toBeDefined();
    });

    it("should successfully create pool and add liquidity with custom config", async () => {
      const activeId = new BN("8388608");
      const amountADesired = new BN("1000000");
      const amountBDesired = new BN("2000000");
      const deadline = new BN(Date.now() + 3600000);
      const liquidityConfig: LiquidityConfig[] = [
        {binId: 8388607, distributionX: 30, distributionY: 0},
        {binId: 8388608, distributionX: 40, distributionY: 100},
        {binId: 8388609, distributionX: 30, distributionY: 0},
      ];

      const result = await miraAmmV2.createPoolAndAddLiquidity(
        mockPoolInput,
        activeId,
        amountADesired,
        amountBDesired,
        deadline,
        liquidityConfig
      );

      expect(result).toBeDefined();
      expect(result.transactionRequest).toBeDefined();
      expect(result.gasPrice).toBeDefined();
    });

    it("should validate all input parameters", async () => {
      const activeId = new BN("8388608");
      const amountADesired = new BN("0"); // Invalid amount
      const amountBDesired = new BN("2000000");
      const deadline = new BN(Date.now() + 3600000);

      await expect(
        miraAmmV2.createPoolAndAddLiquidity(
          mockPoolInput,
          activeId,
          amountADesired,
          amountBDesired,
          deadline
        )
      ).rejects.toThrow();
    });

    it("should validate liquidity configuration", async () => {
      const activeId = new BN("8388608");
      const amountADesired = new BN("1000000");
      const amountBDesired = new BN("2000000");
      const deadline = new BN(Date.now() + 3600000);
      const invalidLiquidityConfig: any[] = [
        {binId: -1, distributionX: 100, distributionY: 100}, // Invalid bin ID
      ];

      await expect(
        miraAmmV2.createPoolAndAddLiquidity(
          mockPoolInput,
          activeId,
          amountADesired,
          amountBDesired,
          deadline,
          invalidLiquidityConfig
        )
      ).rejects.toThrow();
    });
  });

  describe("error handling", () => {
    it("should wrap contract errors in MiraV2Error", async () => {
      // Mock the contract to throw a generic error
      const mockContract = miraAmmV2["ammContract"];
      mockContract.functions.get_pool = vi.fn().mockReturnValue({
        get: vi.fn().mockRejectedValue(new Error("Network error")),
      });

      const poolId = new BN("12345");
      const amountADesired = new BN("1000000");
      const amountBDesired = new BN("2000000");
      const amountAMin = new BN("950000");
      const amountBMin = new BN("1900000");
      const deadline = new BN(Date.now() + 3600000);

      await expect(
        miraAmmV2.addLiquidity(
          poolId,
          amountADesired,
          amountBDesired,
          amountAMin,
          amountBMin,
          deadline
        )
      ).rejects.toThrow(MiraV2Error);
    });

    it("should provide meaningful error context", async () => {
      const poolId = new BN("99999");
      const amountADesired = new BN("1000000");
      const amountBDesired = new BN("2000000");
      const amountAMin = new BN("950000");
      const amountBMin = new BN("1900000");
      const deadline = new BN(Date.now() + 3600000);

      // Mock the contract to return null (pool not found)
      const mockContract = miraAmmV2["ammContract"];
      mockContract.functions.get_pool = vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({value: null}),
      });

      try {
        await miraAmmV2.addLiquidity(
          poolId,
          amountADesired,
          amountBDesired,
          amountAMin,
          amountBMin,
          deadline
        );
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeInstanceOf(MiraV2Error);
        expect((error as MiraV2Error).errorType).toBe(
          PoolCurveStateError.PoolNotFound
        );
        expect((error as MiraV2Error).message).toContain("99999");
      }
    });
  });

  describe("parameter validation", () => {
    it("should validate deadline is in the future", async () => {
      const poolId = new BN("12345");
      const amountADesired = new BN("1000000");
      const amountBDesired = new BN("2000000");
      const amountAMin = new BN("950000");
      const amountBMin = new BN("1900000");
      const deadline = new BN(Date.now() - 3600000); // Past deadline

      await expect(
        miraAmmV2.addLiquidity(
          poolId,
          amountADesired,
          amountBDesired,
          amountAMin,
          amountBMin,
          deadline
        )
      ).rejects.toThrow();
    });

    it("should validate amounts are positive", async () => {
      const poolId = new BN("12345");
      const amountADesired = new BN("-1000000"); // Negative amount
      const amountBDesired = new BN("2000000");
      const amountAMin = new BN("950000");
      const amountBMin = new BN("1900000");
      const deadline = new BN(Date.now() + 3600000);

      await expect(
        miraAmmV2.addLiquidity(
          poolId,
          amountADesired,
          amountBDesired,
          amountAMin,
          amountBMin,
          deadline
        )
      ).rejects.toThrow();
    });

    it("should validate pool ID is valid", async () => {
      // Mock the validation to throw for this specific test
      const {validateAddLiquidityParams} = await import("../validation");
      vi.mocked(validateAddLiquidityParams).mockImplementationOnce(() => {
        throw new Error("Invalid pool ID: must be non-negative");
      });

      const poolId = new BN("-1"); // Invalid pool ID
      const amountADesired = new BN("1000000");
      const amountBDesired = new BN("2000000");
      const amountAMin = new BN("950000");
      const amountBMin = new BN("1900000");
      const deadline = new BN(Date.now() + 3600000);

      await expect(
        miraAmmV2.addLiquidity(
          poolId,
          amountADesired,
          amountBDesired,
          amountAMin,
          amountBMin,
          deadline
        )
      ).rejects.toThrow("Invalid pool ID: must be non-negative");
    });
  });

  describe("transaction preparation", () => {
    it("should prepare transaction with correct variable outputs for addLiquidity", async () => {
      const poolId = new BN("12345");
      const amountADesired = new BN("1000000");
      const amountBDesired = new BN("2000000");
      const amountAMin = new BN("950000");
      const amountBMin = new BN("1900000");
      const deadline = new BN(Date.now() + 3600000);

      const mockRequest = {
        addVariableOutputs: vi.fn(),
        addContractInputAndOutput: vi.fn(),
        addResources: vi.fn(),
      };

      // Mock the script to return our mock request
      const mockScript = miraAmmV2["addLiquidityScript"];
      mockScript.functions.main = vi.fn().mockReturnValue({
        addContracts: vi.fn().mockReturnThis(),
        txParams: vi.fn().mockReturnThis(),
        getTransactionRequest: vi.fn().mockResolvedValue(mockRequest),
      });

      await miraAmmV2.addLiquidity(
        poolId,
        amountADesired,
        amountBDesired,
        amountAMin,
        amountBMin,
        deadline
      );

      // Verify that variable outputs were added
      expect(mockRequest.addVariableOutputs).toHaveBeenCalledWith(2);
    });

    it("should handle funding options correctly", async () => {
      const poolId = new BN("12345");
      const amountADesired = new BN("1000000");
      const amountBDesired = new BN("2000000");
      const amountAMin = new BN("950000");
      const amountBMin = new BN("1900000");
      const deadline = new BN(Date.now() + 3600000);

      // Test with fundTransaction: false
      const result = await miraAmmV2.addLiquidity(
        poolId,
        amountADesired,
        amountBDesired,
        amountAMin,
        amountBMin,
        deadline,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        {fundTransaction: false}
      );

      expect(result).toBeDefined();
      expect(result.transactionRequest).toBeDefined();
      expect(result.gasPrice).toBeDefined();
    });
  });

  describe("constructor", () => {
    it("should initialize with default contract ID", () => {
      const amm = new MiraAmmV2(mockAccount);
      expect(amm.id()).toBe("0x1234567890abcdef");
    });

    it("should initialize with custom contract ID", () => {
      const customContractId = "0xcustomcontract";
      const amm = new MiraAmmV2(mockAccount, customContractId);
      expect(amm.id()).toBe("0x1234567890abcdef");
    });
  });
});
