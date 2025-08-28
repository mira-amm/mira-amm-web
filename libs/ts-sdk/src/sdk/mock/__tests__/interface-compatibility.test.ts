import {describe, it, expect} from "vitest";
import {BN, AssetId, Address, BigNumberish} from "fuels";
import {MockMiraAmmV2} from "../MockMiraAmmV2";
import {MockReadonlyMiraAmmV2} from "../MockReadonlyMiraAmmV2";
import {MockAccount} from "../MockAccount";
import {MiraAmmV2} from "../../mira_amm_v2";
import {ReadonlyMiraAmmV2} from "../../readonly_mira_amm_v2";
import {
  PoolIdV2,
  PoolInput,
  BinIdDelta,
  TxParams,
  PrepareRequestOptions,
} from "../../model";

/**
 * Interface Compatibility Tests
 *
 * These tests ensure that the mock SDK maintains the same interface
 * as the real SDK, allowing for seamless switching between implementations.
 */

describe("Interface Compatibility Tests", () => {
  let mockAccount: MockAccount;
  let mockAmm: MockMiraAmmV2;
  let mockReadonly: MockReadonlyMiraAmmV2;

  beforeEach(() => {
    mockAccount = MockAccount.createWithTestBalances();
    mockAmm = new MockMiraAmmV2(mockAccount, {defaultFailureRate: 0});
    const mockProvider = MockReadonlyMiraAmmV2.createMockProvider();
    mockReadonly = new MockReadonlyMiraAmmV2(mockProvider);
  });

  describe("MockMiraAmmV2 Interface Compatibility", () => {
    it("should have the same method signatures as MiraAmmV2", () => {
      // Test that all public methods exist with correct signatures

      // id() method
      expect(typeof mockAmm.id).toBe("function");
      expect(mockAmm.id.length).toBe(0); // No parameters

      // addLiquidity method
      expect(typeof mockAmm.addLiquidity).toBe("function");
      expect(mockAmm.addLiquidity.length).toBe(12); // 12 parameters including optional ones

      // removeLiquidity method
      expect(typeof mockAmm.removeLiquidity).toBe("function");
      expect(mockAmm.removeLiquidity.length).toBe(7); // 7 parameters including optional ones

      // swapExactInput method
      expect(typeof mockAmm.swapExactInput).toBe("function");
      expect(mockAmm.swapExactInput.length).toBe(8); // 8 parameters including optional ones

      // swapExactOutput method
      expect(typeof mockAmm.swapExactOutput).toBe("function");
      expect(mockAmm.swapExactOutput.length).toBe(8); // 8 parameters including optional ones

      // createPool method
      expect(typeof mockAmm.createPool).toBe("function");
      expect(mockAmm.createPool.length).toBe(4); // 4 parameters including optional ones
    });

    it("should accept the same parameter types as MiraAmmV2", async () => {
      // Test parameter type compatibility
      const poolId: PoolIdV2 = {
        assetA: {
          bits: "0x0000000000000000000000000000000000000000000000000000000000000000",
        },
        assetB: {
          bits: "0x0000000000000000000000000000000000000000000000000000000000000001",
        },
        binStep: 25,
      };

      const poolInput: PoolInput = {
        assetA: {
          bits: "0x0000000000000000000000000000000000000000000000000000000000000000",
        },
        assetB: {
          bits: "0x0000000000000000000000000000000000000000000000000000000000000001",
        },
        binStep: 25,
        baseFactor: 5000,
      };

      const assetId: AssetId = {
        bits: "0x0000000000000000000000000000000000000000000000000000000000000000",
      };
      const amount: BigNumberish = new BN("1000000");
      const deadline: BigNumberish = new BN(Date.now() + 20 * 60 * 1000);
      const activeId: BigNumberish = 8388608;

      const binIdDeltas: BinIdDelta[] = [
        {binId: 8388608, deltaLiquidity: new BN("1000000")},
      ];

      const distributions: BigNumberish[] = [new BN("5000"), new BN("5000")];

      const txParams: TxParams = {
        gasLimit: new BN("1000000"),
        gasPrice: new BN("1000000000"),
      };

      const options: PrepareRequestOptions = {
        fundTransaction: true,
      };

      // These should not throw type errors
      expect(async () => {
        await mockAmm.createPool(poolInput, activeId, txParams, options);
      }).not.toThrow();

      // Create pool first for other operations
      await mockAmm.createPool(poolInput, activeId);
      const allPools = mockAmm.getStateManager().getAllPools();
      const createdPoolId = new BN(allPools[0].poolId);

      expect(async () => {
        await mockAmm.addLiquidity(
          createdPoolId,
          amount,
          amount,
          amount,
          amount,
          deadline,
          activeId,
          new BN("5"),
          binIdDeltas,
          distributions,
          distributions,
          txParams,
          options
        );
      }).not.toThrow();

      expect(async () => {
        await mockAmm.removeLiquidity(
          createdPoolId,
          [activeId],
          amount,
          amount,
          deadline,
          txParams,
          options
        );
      }).not.toThrow();

      expect(async () => {
        await mockAmm.swapExactInput(
          amount,
          assetId,
          amount,
          [createdPoolId],
          deadline,
          undefined, // receiver
          txParams,
          options
        );
      }).not.toThrow();

      expect(async () => {
        await mockAmm.swapExactOutput(
          amount,
          assetId,
          amount,
          [createdPoolId],
          deadline,
          undefined, // receiver
          txParams,
          options
        );
      }).not.toThrow();
    });

    it("should return the same types as MiraAmmV2", async () => {
      // Test return type compatibility
      const poolInput: PoolInput = {
        assetA: {
          bits: "0x0000000000000000000000000000000000000000000000000000000000000000",
        },
        assetB: {
          bits: "0x0000000000000000000000000000000000000000000000000000000000000001",
        },
        binStep: 25,
        baseFactor: 5000,
      };

      // id() should return string
      const contractId = mockAmm.id();
      expect(typeof contractId).toBe("string");

      // createPool should return transaction with gas price
      const createResult = await mockAmm.createPool(poolInput, 8388608);
      expect(createResult).toHaveProperty("transactionRequest");
      expect(createResult).toHaveProperty("gasPrice");
      expect(createResult.gasPrice).toBeInstanceOf(BN);

      // Get created pool for other tests
      const allPools = mockAmm.getStateManager().getAllPools();
      const poolId = new BN(allPools[0].poolId);

      // addLiquidity should return transaction with gas price
      const addResult = await mockAmm.addLiquidity(
        poolId,
        new BN("1000000"),
        new BN("2000000"),
        new BN("950000"),
        new BN("1900000"),
        new BN(Date.now() + 20 * 60 * 1000),
        8388608
      );
      expect(addResult).toHaveProperty("transactionRequest");
      expect(addResult).toHaveProperty("gasPrice");
      expect(addResult.gasPrice).toBeInstanceOf(BN);

      // All transaction results should have the same structure
      [createResult, addResult].forEach((result) => {
        expect(result.transactionRequest).toBeDefined();
        expect(result.gasPrice).toBeInstanceOf(BN);
        if (result.result) {
          expect(result.result).toHaveProperty("success");
          expect(result.result).toHaveProperty("transactionId");
          expect(result.result).toHaveProperty("gasUsed");
          expect(result.result).toHaveProperty("gasPrice");
          expect(result.result).toHaveProperty("blockNumber");
          expect(result.result).toHaveProperty("timestamp");
          expect(result.result).toHaveProperty("events");
        }
      });
    });
  });

  describe("MockReadonlyMiraAmmV2 Interface Compatibility", () => {
    it("should have the same method signatures as ReadonlyMiraAmmV2", () => {
      // Test that all public methods exist with correct signatures

      // id() method
      expect(typeof mockReadonly.id).toBe("function");
      expect(mockReadonly.id.length).toBe(0);

      // poolMetadata method
      expect(typeof mockReadonly.poolMetadata).toBe("function");
      expect(mockReadonly.poolMetadata.length).toBe(1);

      // poolMetadataBatch method
      expect(typeof mockReadonly.poolMetadataBatch).toBe("function");
      expect(mockReadonly.poolMetadataBatch.length).toBe(1);

      // fees method
      expect(typeof mockReadonly.fees).toBe("function");
      expect(mockReadonly.fees.length).toBe(1);

      // getBinLiquidity method
      expect(typeof mockReadonly.getBinLiquidity).toBe("function");
      expect(mockReadonly.getBinLiquidity.length).toBe(2);

      // getActiveBin method
      expect(typeof mockReadonly.getActiveBin).toBe("function");
      expect(mockReadonly.getActiveBin.length).toBe(1);

      // getBinRange method
      expect(typeof mockReadonly.getBinRange).toBe("function");
      expect(mockReadonly.getBinRange.length).toBe(3);

      // previewSwapExactInput method
      expect(typeof mockReadonly.previewSwapExactInput).toBe("function");
      expect(mockReadonly.previewSwapExactInput.length).toBe(3);

      // previewSwapExactOutput method
      expect(typeof mockReadonly.previewSwapExactOutput).toBe("function");
      expect(mockReadonly.previewSwapExactOutput.length).toBe(3);

      // getAmountsOut method
      expect(typeof mockReadonly.getAmountsOut).toBe("function");
      expect(mockReadonly.getAmountsOut.length).toBe(3);

      // getAmountsIn method
      expect(typeof mockReadonly.getAmountsIn).toBe("function");
      expect(mockReadonly.getAmountsIn.length).toBe(3);
    });

    it("should accept the same parameter types as ReadonlyMiraAmmV2", async () => {
      // Set up test data
      const poolId: PoolIdV2 = {
        assetA: {
          bits: "0x0000000000000000000000000000000000000000000000000000000000000000",
        },
        assetB: {
          bits: "0x0000000000000000000000000000000000000000000000000000000000000001",
        },
        binStep: 25,
      };

      const assetId: AssetId = {
        bits: "0x0000000000000000000000000000000000000000000000000000000000000000",
      };
      const amount: BigNumberish = new BN("1000000");
      const binId: BigNumberish = 8388608;

      // Create a pool for testing
      await mockAmm.createPool(
        {
          assetA: poolId.assetA,
          assetB: poolId.assetB,
          binStep: 25,
          baseFactor: 5000,
        },
        8388608
      );

      const allPools = mockAmm.getStateManager().getAllPools();
      const createdPoolId = new BN(allPools[0].poolId);

      // Share state manager
      mockReadonly.setStateManager(mockAmm.getStateManager());

      // These should not throw type errors
      expect(async () => {
        await mockReadonly.poolMetadata(createdPoolId);
      }).not.toThrow();

      expect(async () => {
        await mockReadonly.poolMetadataBatch([createdPoolId]);
      }).not.toThrow();

      expect(async () => {
        await mockReadonly.fees(createdPoolId);
      }).not.toThrow();

      expect(async () => {
        await mockReadonly.getBinLiquidity(createdPoolId, binId);
      }).not.toThrow();

      expect(async () => {
        await mockReadonly.getActiveBin(createdPoolId);
      }).not.toThrow();

      expect(async () => {
        await mockReadonly.getBinRange(createdPoolId, binId, binId);
      }).not.toThrow();

      expect(async () => {
        await mockReadonly.previewSwapExactInput(assetId, amount, [
          createdPoolId,
        ]);
      }).not.toThrow();

      expect(async () => {
        await mockReadonly.previewSwapExactOutput(assetId, amount, [
          createdPoolId,
        ]);
      }).not.toThrow();

      expect(async () => {
        await mockReadonly.getAmountsOut(assetId, amount, [createdPoolId]);
      }).not.toThrow();

      expect(async () => {
        await mockReadonly.getAmountsIn(assetId, amount, [createdPoolId]);
      }).not.toThrow();
    });

    it("should return the same types as ReadonlyMiraAmmV2", async () => {
      // Create a pool for testing
      await mockAmm.createPool(
        {
          assetA: {
            bits: "0x0000000000000000000000000000000000000000000000000000000000000000",
          },
          assetB: {
            bits: "0x0000000000000000000000000000000000000000000000000000000000000001",
          },
          binStep: 25,
          baseFactor: 5000,
        },
        8388608
      );

      const allPools = mockAmm.getStateManager().getAllPools();
      const poolId = new BN(allPools[0].poolId);
      const assetId: AssetId = {
        bits: "0x0000000000000000000000000000000000000000000000000000000000000000",
      };

      // Share state manager
      mockReadonly.setStateManager(mockAmm.getStateManager());

      // id() should return string
      const contractId = mockReadonly.id();
      expect(typeof contractId).toBe("string");

      // poolMetadata should return PoolMetadataV2 or null
      const metadata = await mockReadonly.poolMetadata(poolId);
      if (metadata) {
        expect(metadata).toHaveProperty("pool");
        expect(metadata).toHaveProperty("bin_step");
        expect(metadata).toHaveProperty("base_factor");
        expect(metadata).toHaveProperty("filter_period");
        expect(metadata).toHaveProperty("decay_period");
        expect(metadata).toHaveProperty("reduction_factor");
        expect(metadata).toHaveProperty("variable_fee_control");
        expect(metadata).toHaveProperty("protocol_share");
        expect(metadata).toHaveProperty("max_volatility_accumulator");
        expect(metadata).toHaveProperty("is_open");
      }

      // poolMetadataBatch should return array
      const metadataBatch = await mockReadonly.poolMetadataBatch([poolId]);
      expect(Array.isArray(metadataBatch)).toBe(true);
      expect(metadataBatch.length).toBe(1);

      // fees should return BN
      const fees = await mockReadonly.fees(poolId);
      expect(fees).toBeInstanceOf(BN);

      // getBinLiquidity should return Amounts or null
      const binLiquidity = await mockReadonly.getBinLiquidity(poolId, 8388608);
      if (binLiquidity) {
        expect(binLiquidity).toHaveProperty("x");
        expect(binLiquidity).toHaveProperty("y");
        expect(binLiquidity.x).toBeInstanceOf(BN);
        expect(binLiquidity.y).toBeInstanceOf(BN);
      }

      // getActiveBin should return number or null
      const activeBin = await mockReadonly.getActiveBin(poolId);
      if (activeBin !== null) {
        expect(typeof activeBin).toBe("number");
      }

      // getBinRange should return BinLiquidityInfo array
      const binRange = await mockReadonly.getBinRange(poolId, 8388608, 8388608);
      expect(Array.isArray(binRange)).toBe(true);
      if (binRange.length > 0) {
        expect(binRange[0]).toHaveProperty("binId");
        expect(binRange[0]).toHaveProperty("liquidity");
        expect(typeof binRange[0].binId).toBe("number");
        expect(binRange[0].liquidity).toHaveProperty("x");
        expect(binRange[0].liquidity).toHaveProperty("y");
      }

      // previewSwapExactInput should return Asset tuple
      const previewInput = await mockReadonly.previewSwapExactInput(
        assetId,
        new BN("1000000"),
        [poolId]
      );
      expect(Array.isArray(previewInput)).toBe(true);
      expect(previewInput.length).toBe(2);
      expect(previewInput[0]).toHaveProperty("bits");
      expect(previewInput[1]).toBeInstanceOf(BN);

      // previewSwapExactOutput should return Asset tuple
      const previewOutput = await mockReadonly.previewSwapExactOutput(
        assetId,
        new BN("1000000"),
        [poolId]
      );
      expect(Array.isArray(previewOutput)).toBe(true);
      expect(previewOutput.length).toBe(2);
      expect(previewOutput[0]).toHaveProperty("bits");
      expect(previewOutput[1]).toBeInstanceOf(BN);

      // getAmountsOut should return Asset array
      const amountsOut = await mockReadonly.getAmountsOut(
        assetId,
        new BN("1000000"),
        [poolId]
      );
      expect(Array.isArray(amountsOut)).toBe(true);
      expect(amountsOut.length).toBeGreaterThan(0);
      amountsOut.forEach((asset) => {
        expect(Array.isArray(asset)).toBe(true);
        expect(asset.length).toBe(2);
        expect(asset[0]).toHaveProperty("bits");
        expect(asset[1]).toBeInstanceOf(BN);
      });

      // getAmountsIn should return Asset array
      const amountsIn = await mockReadonly.getAmountsIn(
        assetId,
        new BN("1000000"),
        [poolId]
      );
      expect(Array.isArray(amountsIn)).toBe(true);
      expect(amountsIn.length).toBeGreaterThan(0);
      amountsIn.forEach((asset) => {
        expect(Array.isArray(asset)).toBe(true);
        expect(asset.length).toBe(2);
        expect(asset[0]).toHaveProperty("bits");
        expect(asset[1]).toBeInstanceOf(BN);
      });
    });
  });

  describe("Error Handling Compatibility", () => {
    it("should throw similar error types as real SDK", async () => {
      // Test error compatibility
      const nonExistentPoolId = new BN("999999");

      // Should return null for non-existent pool (not throw)
      const metadata = await mockReadonly.poolMetadata(nonExistentPoolId);
      expect(metadata).toBeNull();

      // Should throw for invalid operations
      try {
        await mockAmm.addLiquidity(
          nonExistentPoolId,
          new BN("1000000"),
          new BN("2000000"),
          new BN("950000"),
          new BN("1900000"),
          new BN(Date.now() + 20 * 60 * 1000),
          8388608
        );
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain("Pool not found");
      }

      // Test insufficient balance error
      try {
        // Create a pool first
        await mockAmm.createPool(
          {
            assetA: {
              bits: "0x0000000000000000000000000000000000000000000000000000000000000000",
            },
            assetB: {
              bits: "0x0000000000000000000000000000000000000000000000000000000000000001",
            },
            binStep: 25,
            baseFactor: 5000,
          },
          8388608
        );

        const allPools = mockAmm.getStateManager().getAllPools();
        const poolId = new BN(allPools[0].poolId);

        await mockAmm.addLiquidity(
          poolId,
          new BN("100000000000000000000"), // Excessive amount
          new BN("2000000"),
          new BN("950000"),
          new BN("1900000"),
          new BN(Date.now() + 20 * 60 * 1000),
          8388608
        );
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain("Insufficient balance");
      }
    });
  });

  describe("Configuration Compatibility", () => {
    it("should accept similar configuration options", () => {
      // Test that mock SDK accepts similar configuration as real SDK
      const config = {
        defaultFailureRate: 0.1,
        defaultLatencyMs: 500,
        enableRealisticGas: true,
        enablePriceImpact: true,
        enableSlippageSimulation: true,
      };

      expect(() => {
        new MockMiraAmmV2(mockAccount, config);
      }).not.toThrow();

      expect(() => {
        const provider = MockReadonlyMiraAmmV2.createMockProvider();
        new MockReadonlyMiraAmmV2(provider, undefined, config);
      }).not.toThrow();
    });

    it("should work with default configuration", () => {
      expect(() => {
        new MockMiraAmmV2(mockAccount);
      }).not.toThrow();

      expect(() => {
        const provider = MockReadonlyMiraAmmV2.createMockProvider();
        new MockReadonlyMiraAmmV2(provider);
      }).not.toThrow();
    });
  });
});
