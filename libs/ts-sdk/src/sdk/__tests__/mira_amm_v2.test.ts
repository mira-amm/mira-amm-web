import {describe, it, expect, vi, beforeEach} from "vitest";
import {Account, BN, Provider} from "fuels";
import {MiraAmmV2} from "../mira_amm_v2";
import {PoolCurveStateError, MiraV2Error} from "../model";

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
  })),
  SwapExactIn: vi.fn().mockImplementation(() => ({
    setConfigurableConstants: vi.fn().mockReturnThis(),
  })),
  SwapExactOut: vi.fn().mockImplementation(() => ({
    setConfigurableConstants: vi.fn().mockReturnThis(),
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
