import {BN, AssetId} from "fuels";
import {MockAccount} from "../MockAccount";
import {MockMiraAmmV2} from "../MockMiraAmmV2";
import {MockReadonlyMiraAmmV2} from "../MockReadonlyMiraAmmV2";
import {PoolIdV2} from "../../model";
import {it} from "node:test";
import {beforeEach} from "node:test";
import {describe} from "node:test";
import {it} from "node:test";
import {it} from "node:test";
import {it} from "node:test";
import {it} from "node:test";
import {it} from "node:test";
import {it} from "node:test";
import {it} from "node:test";
import {it} from "node:test";
import {beforeEach} from "node:test";
import {describe} from "node:test";
import {it} from "node:test";
import {it} from "node:test";
import {it} from "node:test";
import {it} from "node:test";
import {it} from "node:test";
import {it} from "node:test";
import {describe} from "node:test";
import {beforeEach} from "node:test";
import {describe} from "node:test";

describe("MockMiraAmmV2", () => {
  let account: MockAccount;
  let mockAmm: MockMiraAmmV2;
  let readonlyAmm: MockReadonlyMiraAmmV2;
  let poolId: PoolIdV2;
  let assetX: AssetId;
  let assetY: AssetId;

  beforeEach(() => {
    // Create test account with balances
    account = MockAccount.createWithTestBalances();

    // Create mock AMM instances with no error simulation for tests
    mockAmm = new MockMiraAmmV2(account, {defaultFailureRate: 0});
    const mockProvider = MockReadonlyMiraAmmV2.createMockProvider();
    readonlyAmm = new MockReadonlyMiraAmmV2(mockProvider, undefined, {
      defaultFailureRate: 0,
    });

    // Set up test assets and pool
    assetX = {
      bits: "0x0000000000000000000000000000000000000000000000000000000000000000",
    };
    assetY = {
      bits: "0x0000000000000000000000000000000000000000000000000000000000000001",
    };

    poolId = new BN("12345");
  });

  describe("MockMiraAmmV2 Write Operations", () => {
    it("should have correct interface methods", () => {
      expect(typeof mockAmm.id).toBe("function");
      expect(typeof mockAmm.addLiquidity).toBe("function");
      expect(typeof mockAmm.removeLiquidity).toBe("function");
      expect(typeof mockAmm.swapExactInput).toBe("function");
      expect(typeof mockAmm.swapExactOutput).toBe("function");
      expect(typeof mockAmm.createPool).toBe("function");
    });

    it("should return mock contract ID", () => {
      const contractId = mockAmm.id();
      expect(contractId).toBe(
        "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
      );
    });

    it("should create a new pool", async () => {
      const poolInput = {
        assetX,
        assetY,
        binStep: 25,
        baseFactor: 5000,
      };

      const activeId = 8388608;
      const deadline = new BN(Date.now() + 20 * 60 * 1000);

      const result = await mockAmm.createPool(poolInput, activeId, {}, {});

      expect(result).toBeDefined();
      expect(result.transactionRequest).toBeDefined();
      expect(result.gasPrice).toBeDefined();
      expect(result.result?.success).toBe(true);

      // Verify pool was created in state
      const stateManager = mockAmm.getStateManager();
      const allPools = stateManager.getAllPools();
      expect(allPools.length).toBeGreaterThan(0);
      const createdPool = allPools[0];
      expect(createdPool).toBeDefined();
      expect(createdPool?.activeBinId).toBe(activeId);
    });

    it("should add liquidity to existing pool", async () => {
      // First create a pool
      const poolInput = {
        assetX,
        assetY,
        binStep: 25,
        baseFactor: 5000,
      };

      const activeId = 8388608;
      const createResult = await mockAmm.createPool(poolInput, activeId);

      // Get the created pool ID from state manager
      const stateManager = mockAmm.getStateManager();
      const allPools = stateManager.getAllPools();
      expect(allPools.length).toBeGreaterThan(0);
      const createdPoolId = new BN(allPools[0].poolId);

      // Now add liquidity
      const amountA = new BN("1000000");
      const amountB = new BN("2000000");
      const deadline = new BN(Date.now() + 20 * 60 * 1000);

      const result = await mockAmm.addLiquidity(
        createdPoolId,
        amountA,
        amountB,
        amountA.mul(95).div(100), // 5% slippage
        amountB.mul(95).div(100), // 5% slippage
        deadline,
        activeId
      );

      expect(result).toBeDefined();
      expect(result.result?.success).toBe(true);

      // Verify balances were updated
      const balanceA = account.getBalance(assetX.bits);
      const balanceB = account.getBalance(assetY.bits);
      expect(balanceA.lt(new BN("1000000000000000000"))).toBe(true); // Less than initial
      expect(balanceB.lt(new BN("1000000000"))).toBe(true); // Less than initial
    });

    it("should fail to add liquidity with insufficient balance", async () => {
      // Create pool first
      const poolInput = {
        assetX,
        assetY,
        binStep: 25,
        baseFactor: 5000,
      };
      await mockAmm.createPool(poolInput, 8388608);

      // Get the created pool ID
      const stateManager = mockAmm.getStateManager();
      const allPools = stateManager.getAllPools();
      const createdPoolId = new BN(allPools[0].poolId);

      // Try to add more liquidity than available
      const excessiveAmount = new BN("10000000000000000000"); // 10 ETH
      const deadline = new BN(Date.now() + 20 * 60 * 1000);

      await expect(
        mockAmm.addLiquidity(
          createdPoolId,
          excessiveAmount,
          new BN("1000000"),
          new BN("1"),
          new BN("1"),
          deadline
        )
      ).rejects.toThrow("Insufficient balance");
    });

    it("should perform swap exact input", async () => {
      // Create pool first
      const poolInput = {
        assetX,
        assetY,
        binStep: 25,
        baseFactor: 5000,
      };
      await mockAmm.createPool(poolInput, 8388608);

      // Get the created pool ID
      const stateManager = mockAmm.getStateManager();
      const allPools = stateManager.getAllPools();
      const createdPoolId = new BN(allPools[0].poolId);

      const amountIn = new BN("1000000");
      const amountOutMin = new BN("900000");
      const deadline = new BN(Date.now() + 20 * 60 * 1000);

      const result = await mockAmm.swapExactInput(
        amountIn,
        assetX,
        amountOutMin,
        [createdPoolId],
        deadline
      );

      expect(result).toBeDefined();
      expect(result.result?.success).toBe(true);
    });
  });

  describe("MockReadonlyMiraAmmV2 Read Operations", () => {
    beforeEach(() => {
      // Share state manager between write and read instances
      const stateManager = mockAmm.getStateManager();
      readonlyAmm.setStateManager(stateManager);
    });

    it("should have correct interface methods", () => {
      expect(typeof readonlyAmm.id).toBe("function");
      expect(typeof readonlyAmm.poolMetadata).toBe("function");
      expect(typeof readonlyAmm.poolMetadataBatch).toBe("function");
      expect(typeof readonlyAmm.fees).toBe("function");
      expect(typeof readonlyAmm.getBinLiquidity).toBe("function");
      expect(typeof readonlyAmm.getActiveBin).toBe("function");
      expect(typeof readonlyAmm.getBinRange).toBe("function");
      expect(typeof readonlyAmm.previewSwapExactInput).toBe("function");
      expect(typeof readonlyAmm.previewSwapExactOutput).toBe("function");
    });

    it("should return null for non-existent pool", async () => {
      const metadata = await readonlyAmm.poolMetadata(new BN("999999"));
      expect(metadata).toBeNull();
    });

    it("should return pool metadata for existing pool", async () => {
      // Create a pool first
      const poolInput = {
        assetX,
        assetY,
        binStep: 25,
        baseFactor: 5000,
      };
      const activeId = 8388608;
      await mockAmm.createPool(poolInput, activeId);

      // Get the created pool ID
      const stateManager = mockAmm.getStateManager();
      const allPools = stateManager.getAllPools();
      const createdPoolId = new BN(allPools[0].poolId);

      const metadata = await readonlyAmm.poolMetadata(createdPoolId);

      expect(metadata).toBeDefined();
      expect(metadata?.pool.asset_x.bits).toBe(assetX.bits);
      expect(metadata?.pool.asset_y.bits).toBe(assetY.bits);
      expect(metadata?.pool.bin_step).toBe(poolInput.binStep);
    });

    it("should return active bin for existing pool", async () => {
      // Create a pool first
      const poolInput = {
        assetX,
        assetY,
        binStep: 25,
        baseFactor: 5000,
      };
      const activeId = 8388608;
      await mockAmm.createPool(poolInput, activeId);

      // Get the created pool ID
      const stateManager = mockAmm.getStateManager();
      const allPools = stateManager.getAllPools();
      const createdPoolId = new BN(allPools[0].poolId);

      const activeBin = await readonlyAmm.getActiveBin(createdPoolId);

      expect(activeBin).toBe(activeId);
    });

    it("should return bin liquidity", async () => {
      // Create a pool first
      const poolInput = {
        assetX,
        assetY,
        binStep: 25,
        baseFactor: 5000,
      };
      const activeId = 8388608;
      await mockAmm.createPool(poolInput, activeId);

      // Get the created pool ID
      const stateManager = mockAmm.getStateManager();
      const allPools = stateManager.getAllPools();
      const createdPoolId = new BN(allPools[0].poolId);

      const liquidity = await readonlyAmm.getBinLiquidity(
        createdPoolId,
        activeId
      );

      expect(liquidity).toBeDefined();
      expect(liquidity?.x).toBeDefined();
      expect(liquidity?.y).toBeDefined();
    });

    it("should return bin range", async () => {
      // Create a pool first
      const poolInput = {
        assetX,
        assetY,
        binStep: 25,
        baseFactor: 5000,
      };
      const activeId = 8388608;
      await mockAmm.createPool(poolInput, activeId);

      // Get the created pool ID
      const stateManager = mockAmm.getStateManager();
      const allPools = stateManager.getAllPools();
      const createdPoolId = new BN(allPools[0].poolId);

      const binRange = await readonlyAmm.getBinRange(
        createdPoolId,
        activeId - 5,
        activeId + 5
      );

      expect(binRange).toBeDefined();
      expect(binRange.length).toBe(11); // 5 bins below + active + 5 bins above
      expect(binRange[5].binId).toBe(activeId); // Middle should be active bin
    });

    it("should preview swap exact input", async () => {
      // Create a pool first
      const poolInput = {
        assetX,
        assetY,
        binStep: 25,
        baseFactor: 5000,
      };
      await mockAmm.createPool(poolInput, 8388608);

      // Get the created pool ID
      const stateManager = mockAmm.getStateManager();
      const allPools = stateManager.getAllPools();
      const createdPoolId = new BN(allPools[0].poolId);

      const amountIn = new BN("1000000");

      const result = await readonlyAmm.previewSwapExactInput(assetX, amountIn, [
        createdPoolId,
      ]);

      expect(result).toBeDefined();
      expect(result[0]).toEqual(assetY); // Output asset should be Y
      expect(result[1]).toBeInstanceOf(BN);
      expect((result[1] as BN).gt(0)).toBe(true);
    });

    it("should get amounts out for multi-hop", async () => {
      // Create a pool first
      const poolInput = {
        assetX,
        assetY,
        binStep: 25,
        baseFactor: 5000,
      };
      await mockAmm.createPool(poolInput, 8388608);

      // Get the created pool ID
      const stateManager = mockAmm.getStateManager();
      const allPools = stateManager.getAllPools();
      const createdPoolId = new BN(allPools[0].poolId);

      const amountIn = new BN("1000000");

      const amounts = await readonlyAmm.getAmountsOut(assetX, amountIn, [
        createdPoolId,
      ]);

      expect(amounts).toBeDefined();
      expect(amounts.length).toBe(2); // Input + output
      expect(amounts[0][0]).toEqual(assetX);
      expect(amounts[1][0]).toEqual(assetY);
    });
  });

  describe("Integration Tests", () => {
    beforeEach(() => {
      // Share state manager between write and read instances
      const stateManager = mockAmm.getStateManager();
      readonlyAmm.setStateManager(stateManager);
    });

    it("should maintain state consistency between write and read operations", async () => {
      // Create pool
      const poolInput = {
        assetX,
        assetY,
        binStep: 25,
        baseFactor: 5000,
      };
      const activeId = 8388608;
      await mockAmm.createPool(poolInput, activeId);

      // Get the created pool ID
      const stateManager = mockAmm.getStateManager();
      const allPools = stateManager.getAllPools();
      const createdPoolId = new BN(allPools[0].poolId);

      // Verify pool exists via read operations
      const metadata = await readonlyAmm.poolMetadata(createdPoolId);
      expect(metadata).toBeDefined();

      // Add liquidity
      const amountA = new BN("1000000");
      const amountB = new BN("2000000");
      const deadline = new BN(Date.now() + 20 * 60 * 1000);

      await mockAmm.addLiquidity(
        createdPoolId,
        amountA,
        amountB,
        amountA.mul(95).div(100),
        amountB.mul(95).div(100),
        deadline,
        activeId
      );

      // Verify position exists
      const position = stateManager.getUserPosition(
        account.address,
        createdPoolId
      );
      expect(position).toBeDefined();
      expect(position?.binPositions.size).toBeGreaterThan(0);
    });
  });
});
