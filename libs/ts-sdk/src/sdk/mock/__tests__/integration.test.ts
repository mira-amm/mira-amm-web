import {describe, it, expect, beforeEach} from "vitest";
import {BN, AssetId} from "fuels";
import {
  MockAccount,
  MockSDKConfig,
  DEFAULT_MOCK_CONFIG,
  MockMiraAmmV2,
  MockReadonlyMiraAmmV2,
  MockStateManager,
} from "../index";
import {PoolIdV2} from "../../model";

describe("Mock SDK Integration", () => {
  it("should export all required components", () => {
    // Verify MockAccount is exported
    expect(MockAccount).toBeDefined();
    expect(typeof MockAccount).toBe("function");

    // Verify types are exported
    expect(DEFAULT_MOCK_CONFIG).toBeDefined();
    expect(typeof DEFAULT_MOCK_CONFIG).toBe("object");
  });

  it("should create MockAccount with default config", () => {
    const account = MockAccount.createWithTestBalances();

    expect(account).toBeInstanceOf(MockAccount);
    expect(account.address).toBe("0x1234567890abcdef");
    expect(account.getAllBalances().size).toBe(3);
  });

  it("should have proper default configuration", () => {
    expect(DEFAULT_MOCK_CONFIG.enablePersistence).toBe(false);
    expect(DEFAULT_MOCK_CONFIG.defaultFailureRate).toBe(0.05);
    expect(DEFAULT_MOCK_CONFIG.defaultLatencyMs).toBe(1000);
    expect(DEFAULT_MOCK_CONFIG.enableRealisticGas).toBe(true);
    expect(DEFAULT_MOCK_CONFIG.enablePriceImpact).toBe(true);
    expect(DEFAULT_MOCK_CONFIG.enableSlippageSimulation).toBe(true);
  });
});

describe("Complete User Workflow Integration Tests", () => {
  let account: MockAccount;
  let mockAmm: MockMiraAmmV2;
  let readonlyAmm: MockReadonlyMiraAmmV2;
  let stateManager: MockStateManager;
  let assetA: AssetId;
  let assetB: AssetId;
  let poolId: PoolIdV2;

  beforeEach(() => {
    // Create test account with substantial balances
    account = MockAccount.createWithTestBalances();

    // Create mock SDK instances with no error simulation for integration tests
    const config: MockSDKConfig = {
      ...DEFAULT_MOCK_CONFIG,
      defaultFailureRate: 0,
      defaultLatencyMs: 10, // Faster for tests
    };

    mockAmm = new MockMiraAmmV2(account, config);
    const mockProvider = MockReadonlyMiraAmmV2.createMockProvider();
    readonlyAmm = new MockReadonlyMiraAmmV2(mockProvider, undefined, config);

    // Share state manager between instances
    stateManager = mockAmm.getStateManager();
    readonlyAmm.setStateManager(stateManager);

    // Set up test assets
    assetA = {
      bits: "0x0000000000000000000000000000000000000000000000000000000000000000",
    };
    assetB = {
      bits: "0x0000000000000000000000000000000000000000000000000000000000000001",
    };

    poolId = {
      assetA,
      assetB,
      binStep: 25,
    };
  });

  describe("Complete Liquidity Provider Workflow", () => {
    it("should complete full LP workflow: create pool -> add liquidity -> check position -> remove liquidity", async () => {
      // Step 1: Create a new pool
      const poolInput = {
        assetA,
        assetB,
        binStep: 25,
        baseFactor: 5000,
      };
      const activeId = 8388608;

      const createResult = await mockAmm.createPool(poolInput, activeId);
      expect(createResult.result?.success).toBe(true);

      // Get the created pool ID
      const allPools = stateManager.getAllPools();
      expect(allPools.length).toBe(1);
      const createdPoolId = new BN(allPools[0].poolId);

      // Step 2: Verify pool exists via read operations
      const metadata = await readonlyAmm.poolMetadata(createdPoolId);
      expect(metadata).toBeDefined();
      expect(metadata?.pool.asset_a.bits).toBe(assetA.bits);
      expect(metadata?.pool.asset_b.bits).toBe(assetB.bits);

      const activeBin = await readonlyAmm.getActiveBin(createdPoolId);
      expect(activeBin).toBe(activeId);

      // Step 3: Add liquidity to the pool
      const amountA = new BN("1000000");
      const amountB = new BN("2000000");
      const deadline = new BN(Date.now() + 20 * 60 * 1000);

      const initialBalanceA = account.getBalance(assetA.bits);
      const initialBalanceB = account.getBalance(assetB.bits);

      const addResult = await mockAmm.addLiquidity(
        createdPoolId,
        amountA,
        amountB,
        amountA.mul(95).div(100), // 5% slippage tolerance
        amountB.mul(95).div(100),
        deadline,
        activeId
      );
      expect(addResult.result?.success).toBe(true);

      // Step 4: Verify balances were updated
      const newBalanceA = account.getBalance(assetA.bits);
      const newBalanceB = account.getBalance(assetB.bits);
      expect(newBalanceA.lt(initialBalanceA)).toBe(true);
      expect(newBalanceB.lt(initialBalanceB)).toBe(true);

      // Step 5: Check position exists in state
      const position = stateManager.getUserPosition(
        account.address,
        createdPoolId
      );
      expect(position).toBeDefined();
      expect(position?.binPositions.size).toBeGreaterThan(0);
      expect(position?.totalValue.assetA.gt(0)).toBe(true);
      expect(position?.totalValue.assetB.gt(0)).toBe(true);

      // Step 6: Verify liquidity is reflected in pool state
      const binLiquidity = await readonlyAmm.getBinLiquidity(
        createdPoolId,
        activeId
      );
      expect(binLiquidity).toBeDefined();
      expect(binLiquidity?.x.gt(0)).toBe(true);
      expect(binLiquidity?.y.gt(0)).toBe(true);

      // Step 7: Remove liquidity
      const removeResult = await mockAmm.removeLiquidity(
        createdPoolId,
        [activeId],
        new BN("100000"), // Min amount A
        new BN("200000"), // Min amount B
        deadline
      );
      expect(removeResult.result?.success).toBe(true);

      // Step 8: Verify balances increased after removal
      const finalBalanceA = account.getBalance(assetA.bits);
      const finalBalanceB = account.getBalance(assetB.bits);
      expect(finalBalanceA.gt(newBalanceA)).toBe(true);
      expect(finalBalanceB.gt(newBalanceB)).toBe(true);

      // Step 9: Verify position was removed or reduced
      const finalPosition = stateManager.getUserPosition(
        account.address,
        createdPoolId
      );
      if (finalPosition) {
        // Position might still exist but with reduced amounts
        expect(
          finalPosition.totalValue.assetA.lt(position!.totalValue.assetA)
        ).toBe(true);
      }
    });

    it("should handle multi-bin liquidity distribution", async () => {
      // Create pool
      const poolInput = {assetA, assetB, binStep: 25, baseFactor: 5000};
      const activeId = 8388608;
      await mockAmm.createPool(poolInput, activeId);

      const allPools = stateManager.getAllPools();
      const createdPoolId = new BN(allPools[0].poolId);

      // Add liquidity with distribution across multiple bins
      const amountA = new BN("5000000");
      const amountB = new BN("10000000");
      const deadline = new BN(Date.now() + 20 * 60 * 1000);

      // Define distribution across 5 bins
      const deltaIds = [
        {binId: activeId - 2, deltaLiquidity: new BN("1000000")},
        {binId: activeId - 1, deltaLiquidity: new BN("2000000")},
        {binId: activeId, deltaLiquidity: new BN("4000000")},
        {binId: activeId + 1, deltaLiquidity: new BN("2000000")},
        {binId: activeId + 2, deltaLiquidity: new BN("1000000")},
      ];

      const addResult = await mockAmm.addLiquidity(
        createdPoolId,
        amountA,
        amountB,
        amountA.mul(90).div(100),
        amountB.mul(90).div(100),
        deadline,
        activeId,
        new BN("5"), // 5% slippage on active ID
        deltaIds
      );
      expect(addResult.result?.success).toBe(true);

      // Verify position spans multiple bins
      const position = stateManager.getUserPosition(
        account.address,
        createdPoolId
      );
      expect(position).toBeDefined();
      expect(position?.binPositions.size).toBeGreaterThanOrEqual(3); // Should have positions in multiple bins

      // Verify bin range query returns liquidity
      const binRange = await readonlyAmm.getBinRange(
        createdPoolId,
        activeId - 3,
        activeId + 3
      );
      expect(binRange.length).toBe(7);

      const liquidityBins = binRange.filter(
        (bin) => bin.liquidity.x.gt(0) || bin.liquidity.y.gt(0)
      );
      expect(liquidityBins.length).toBeGreaterThan(1);
    });
  });

  describe("Complete Trader Workflow", () => {
    beforeEach(async () => {
      // Set up a pool with liquidity for trading
      const poolInput = {assetA, assetB, binStep: 25, baseFactor: 5000};
      const activeId = 8388608;
      await mockAmm.createPool(poolInput, activeId);

      const allPools = stateManager.getAllPools();
      const createdPoolId = new BN(allPools[0].poolId);

      // Add substantial liquidity
      const amountA = new BN("10000000");
      const amountB = new BN("20000000");
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
    });

    it("should complete swap workflow: preview -> execute -> verify", async () => {
      const allPools = stateManager.getAllPools();
      const poolId = new BN(allPools[0].poolId);

      // Step 1: Preview swap exact input
      const amountIn = new BN("1000000");
      const previewResult = await readonlyAmm.previewSwapExactInput(
        assetA,
        amountIn,
        [poolId]
      );

      expect(previewResult).toBeDefined();
      expect(previewResult[0]).toEqual(assetB); // Output asset
      expect((previewResult[1] as BN).gt(0)).toBe(true); // Output amount

      const expectedAmountOut = previewResult[1] as BN;

      // Step 2: Execute swap with slippage tolerance
      const initialBalanceA = account.getBalance(assetA.bits);
      const initialBalanceB = account.getBalance(assetB.bits);
      const deadline = new BN(Date.now() + 20 * 60 * 1000);

      const swapResult = await mockAmm.swapExactInput(
        amountIn,
        assetA,
        expectedAmountOut.mul(95).div(100), // 5% slippage tolerance
        [poolId],
        deadline
      );
      expect(swapResult.result?.success).toBe(true);

      // Step 3: Verify balance changes
      const finalBalanceA = account.getBalance(assetA.bits);
      const finalBalanceB = account.getBalance(assetB.bits);

      expect(finalBalanceA.eq(initialBalanceA.sub(amountIn))).toBe(true);
      expect(finalBalanceB.gt(initialBalanceB)).toBe(true);

      // Step 4: Verify transaction was recorded
      const userTransactions = stateManager.getUserTransactions(
        account.address
      );
      const swapTransaction = userTransactions.find((tx) => tx.type === "swap");
      expect(swapTransaction).toBeDefined();
      expect(swapTransaction?.result.success).toBe(true);
    });

    it("should handle multi-hop swaps", async () => {
      // Create a second pool for multi-hop
      const assetC: AssetId = {
        bits: "0x0000000000000000000000000000000000000000000000000000000000000002",
      };

      // Add asset C to account balance
      account.updateBalance(assetC.bits, new BN("1000000000"));

      const poolInput2 = {
        assetA: assetB,
        assetB: assetC,
        binStep: 25,
        baseFactor: 5000,
      };
      await mockAmm.createPool(poolInput2, 8388608);

      const allPools = stateManager.getAllPools();
      const pool2Id = new BN(allPools[1].poolId);

      // Add liquidity to second pool
      await mockAmm.addLiquidity(
        pool2Id,
        new BN("5000000"),
        new BN("10000000"),
        new BN("4750000"),
        new BN("9500000"),
        new BN(Date.now() + 20 * 60 * 1000),
        8388608
      );

      // Execute multi-hop swap: A -> B -> C
      const pool1Id = new BN(allPools[0].poolId);
      const amountIn = new BN("500000");
      const deadline = new BN(Date.now() + 20 * 60 * 1000);

      const initialBalanceA = account.getBalance(assetA.bits);
      const initialBalanceC = account.getBalance(assetC.bits);

      // Preview multi-hop
      const amounts = await readonlyAmm.getAmountsOut(assetA, amountIn, [
        pool1Id,
        pool2Id,
      ]);
      expect(amounts.length).toBe(3); // Input + intermediate + output
      expect(amounts[0][0]).toEqual(assetA);
      expect(amounts[1][0]).toEqual(assetB);
      expect(amounts[2][0]).toEqual(assetC);

      // Execute multi-hop swap
      const swapResult = await mockAmm.swapExactInput(
        amountIn,
        assetA,
        new BN("1"), // Minimal output requirement
        [pool1Id, pool2Id],
        deadline
      );
      expect(swapResult.result?.success).toBe(true);

      // Verify final balances
      const finalBalanceA = account.getBalance(assetA.bits);
      const finalBalanceC = account.getBalance(assetC.bits);

      expect(finalBalanceA.eq(initialBalanceA.sub(amountIn))).toBe(true);
      expect(finalBalanceC.gt(initialBalanceC)).toBe(true);
    });
  });

  describe("State Consistency Across Operations", () => {
    it("should maintain consistent state across multiple operations", async () => {
      // Create pool
      const poolInput = {assetA, assetB, binStep: 25, baseFactor: 5000};
      await mockAmm.createPool(poolInput, 8388608);

      const allPools = stateManager.getAllPools();
      const poolId = new BN(allPools[0].poolId);

      // Track initial state
      let poolState = stateManager.getPool(poolId);
      expect(poolState).toBeDefined();
      const initialVolume = poolState!.volume24h;

      // Add liquidity
      await mockAmm.addLiquidity(
        poolId,
        new BN("2000000"),
        new BN("4000000"),
        new BN("1900000"),
        new BN("3800000"),
        new BN(Date.now() + 20 * 60 * 1000),
        8388608
      );

      // Verify pool state updated
      poolState = stateManager.getPool(poolId);
      expect(poolState!.totalReserves.assetA.gt(0)).toBe(true);
      expect(poolState!.totalReserves.assetB.gt(0)).toBe(true);

      // Perform swap
      await mockAmm.swapExactInput(
        new BN("100000"),
        assetA,
        new BN("1"),
        [poolId],
        new BN(Date.now() + 20 * 60 * 1000)
      );

      // Verify volume increased
      poolState = stateManager.getPool(poolId);
      expect(poolState!.volume24h.gt(initialVolume)).toBe(true);

      // Verify transaction history
      const allTransactions = stateManager.getAllTransactions();
      expect(allTransactions.length).toBe(3); // create, addLiquidity, swap

      const transactionTypes = allTransactions.map((tx) => tx.type);
      expect(transactionTypes).toContain("createPool");
      expect(transactionTypes).toContain("addLiquidity");
      expect(transactionTypes).toContain("swap");

      // Verify all transactions succeeded
      const failedTransactions = allTransactions.filter(
        (tx) => !tx.result.success
      );
      expect(failedTransactions.length).toBe(0);
    });

    it("should handle concurrent operations correctly", async () => {
      // Create pool
      const poolInput = {assetA, assetB, binStep: 25, baseFactor: 5000};
      await mockAmm.createPool(poolInput, 8388608);

      const allPools = stateManager.getAllPools();
      const poolId = new BN(allPools[0].poolId);

      // Add initial liquidity
      await mockAmm.addLiquidity(
        poolId,
        new BN("5000000"),
        new BN("10000000"),
        new BN("4750000"),
        new BN("9500000"),
        new BN(Date.now() + 20 * 60 * 1000),
        8388608
      );

      // Simulate concurrent operations
      const operations = [
        mockAmm.swapExactInput(
          new BN("100000"),
          assetA,
          new BN("1"),
          [poolId],
          new BN(Date.now() + 20 * 60 * 1000)
        ),
        mockAmm.swapExactInput(
          new BN("200000"),
          assetB,
          new BN("1"),
          [poolId],
          new BN(Date.now() + 20 * 60 * 1000)
        ),
        mockAmm.addLiquidity(
          poolId,
          new BN("1000000"),
          new BN("2000000"),
          new BN("950000"),
          new BN("1900000"),
          new BN(Date.now() + 20 * 60 * 1000),
          8388608
        ),
      ];

      const results = await Promise.all(operations);

      // All operations should succeed
      results.forEach((result) => {
        expect(result.result?.success).toBe(true);
      });

      // Verify final state consistency
      const finalPoolState = stateManager.getPool(poolId);
      expect(finalPoolState).toBeDefined();
      expect(finalPoolState!.totalReserves.assetA.gt(0)).toBe(true);
      expect(finalPoolState!.totalReserves.assetB.gt(0)).toBe(true);

      // Verify all transactions recorded
      const userTransactions = stateManager.getUserTransactions(
        account.address
      );
      expect(userTransactions.length).toBe(4); // Initial add + 3 concurrent ops
    });
  });

  describe("Error Recovery and Rollback", () => {
    it("should rollback state on failed transactions", async () => {
      // Create pool and add liquidity
      const poolInput = {assetA, assetB, binStep: 25, baseFactor: 5000};
      await mockAmm.createPool(poolInput, 8388608);

      const allPools = stateManager.getAllPools();
      const poolId = new BN(allPools[0].poolId);

      await mockAmm.addLiquidity(
        poolId,
        new BN("2000000"),
        new BN("4000000"),
        new BN("1900000"),
        new BN("3800000"),
        new BN(Date.now() + 20 * 60 * 1000),
        8388608
      );

      // Record initial state
      const initialBalanceA = account.getBalance(assetA.bits);
      const initialBalanceB = account.getBalance(assetB.bits);
      const initialPoolState = stateManager.getPool(poolId);
      const initialTransactionCount = stateManager.getAllTransactions().length;

      // Attempt operation that should fail (insufficient balance)
      try {
        await mockAmm.swapExactInput(
          new BN("100000000000000000000"), // Excessive amount
          assetA,
          new BN("1"),
          [poolId],
          new BN(Date.now() + 20 * 60 * 1000)
        );
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).toContain("Insufficient balance");
      }

      // Verify state was not modified
      const finalBalanceA = account.getBalance(assetA.bits);
      const finalBalanceB = account.getBalance(assetB.bits);
      const finalPoolState = stateManager.getPool(poolId);
      const finalTransactionCount = stateManager.getAllTransactions().length;

      expect(finalBalanceA.eq(initialBalanceA)).toBe(true);
      expect(finalBalanceB.eq(initialBalanceB)).toBe(true);
      expect(finalPoolState!.volume24h.eq(initialPoolState!.volume24h)).toBe(
        true
      );
      expect(finalTransactionCount).toBe(initialTransactionCount); // No failed transaction recorded
    });
  });
});
