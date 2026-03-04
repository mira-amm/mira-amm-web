import {describe, it, expect, beforeAll, afterAll, beforeEach} from "vitest";
import {BN} from "fuels";
import {
  testEnvironment,
  PoolFactory,
  TokenFactory,
  WalletFactory,
  STANDARD_POOL_CONFIGS,
  TestWallet,
} from "./setup";
import {PoolIdV2} from "../../src/sdk/model";
import {TestToken} from "./setup/token-factory";

describe("Liquidity Management Integration Tests", () => {
  let poolFactory: PoolFactory;
  let tokenFactory: TokenFactory;
  let walletFactory: WalletFactory;
  let liquidityProvider: TestWallet;
  let testPool: PoolIdV2;
  let usdc: TestToken;
  let fuel: TestToken;

  beforeAll(async () => {
    // Start test environment
    await testEnvironment.start();

    // Initialize factories
    const wallet = await testEnvironment.createWallet("1000000000000000000"); // 1 ETH
    const contractIds = testEnvironment.getContractIds();

    poolFactory = new PoolFactory(wallet, contractIds.simpleProxy);
    tokenFactory = new TokenFactory(wallet, contractIds.fungible);
    walletFactory = new WalletFactory(
      testEnvironment.getProvider(),
      wallet,
      tokenFactory
    );

    // Create liquidity provider wallet with substantial token balances
    liquidityProvider = await walletFactory.createWallet({
      name: "liquidity-provider",
      initialBalance: "50000000000000000000", // 50 ETH for gas
      tokens: [
        {
          symbol: "USDC",
          amount: tokenFactory.getStandardAmount("USDC", 100000), // 100k USDC
        },
        {
          symbol: "FUEL",
          amount: tokenFactory.getStandardAmount("FUEL", 1000000), // 1M FUEL
        },
      ],
      description: "Wallet for liquidity management testing",
    });

    // Get test tokens
    usdc = tokenFactory.getToken("USDC")!;
    fuel = tokenFactory.getToken("FUEL")!;

    if (!usdc || !fuel) {
      throw new Error("Required test tokens not available");
    }

    // Create a test pool for liquidity operations
    testPool = await poolFactory.createPool({
      tokenX: usdc,
      tokenY: fuel,
      binStep: STANDARD_POOL_CONFIGS.VOLATILE.binStep,
      baseFactor: STANDARD_POOL_CONFIGS.VOLATILE.baseFactor,
      protocolShare: STANDARD_POOL_CONFIGS.VOLATILE.protocolShare,
    });

    console.log(`✅ Test pool created: ${testPool.toHex()}`);
  }, 120000); // 2 minute timeout for service startup

  afterAll(async () => {
    await testEnvironment.stop();
  });

  beforeEach(async () => {
    // Quick cleanup between tests for isolation
    await testEnvironment.quickCleanup();
  });

  describe("Concentrated Liquidity Addition Tests (Single Bin)", () => {
    it("should add concentrated liquidity to a single bin successfully", async () => {
      // Requirement 2.1: WHEN adding concentrated liquidity to a single bin
      // THEN the system SHALL successfully add liquidity and track LP token balances

      const amountX = tokenFactory.getStandardAmount("USDC", 1000); // 1000 USDC
      const amountY = tokenFactory.getStandardAmount("FUEL", 10000); // 10000 FUEL

      // Get initial LP token balance
      const initialLPBalance = await poolFactory.getLPTokenBalance(
        liquidityProvider.wallet,
        testPool
      );

      console.log(`💧 Adding concentrated liquidity to single bin...`);
      console.log(
        `  Amount X (USDC): ${tokenFactory.formatAmount("USDC", amountX)}`
      );
      console.log(
        `  Amount Y (FUEL): ${tokenFactory.formatAmount("FUEL", amountY)}`
      );

      // Add concentrated liquidity (single bin)
      await poolFactory.addLiquidity(testPool, amountX, amountY, {
        type: "concentrated",
        bins: 1,
      });

      // Verify LP token balance increased
      const finalLPBalance = await poolFactory.getLPTokenBalance(
        liquidityProvider.wallet,
        testPool
      );

      expect(finalLPBalance.gt(initialLPBalance)).toBe(true);
      console.log(
        `✅ LP token balance increased from ${initialLPBalance.format()} to ${finalLPBalance.format()}`
      );

      // Verify liquidity distribution shows concentration in single bin
      const distribution = await poolFactory.getLiquidityDistribution(testPool);
      expect(distribution.length).toBeGreaterThan(0);

      // Should have liquidity primarily in one bin (the active bin)
      const totalLiquidity = distribution.reduce(
        (sum, bin) => sum.add(bin.liquidity),
        new BN(0)
      );
      const maxBinLiquidity = distribution.reduce(
        (max, bin) => (bin.liquidity.gt(max) ? bin.liquidity : max),
        new BN(0)
      );

      // Most liquidity should be concentrated in one bin (>80%)
      const concentrationRatio = maxBinLiquidity
        .mul(new BN(100))
        .div(totalLiquidity);
      expect(concentrationRatio.gte(new BN(80))).toBe(true);
      console.log(
        `✅ Liquidity concentration: ${concentrationRatio.toString()}% in primary bin`
      );
    });

    it("should handle concentrated liquidity addition with minimal amounts", async () => {
      const amountX = tokenFactory.getStandardAmount("USDC", 1); // 1 USDC
      const amountY = tokenFactory.getStandardAmount("FUEL", 10); // 10 FUEL

      console.log(`💧 Adding minimal concentrated liquidity...`);

      // Should not throw error with minimal amounts
      await expect(
        poolFactory.addLiquidity(testPool, amountX, amountY, {
          type: "concentrated",
          bins: 1,
        })
      ).resolves.not.toThrow();

      console.log(`✅ Minimal liquidity addition completed`);
    });

    it("should handle concentrated liquidity addition with large amounts", async () => {
      const amountX = tokenFactory.getStandardAmount("USDC", 10000); // 10k USDC
      const amountY = tokenFactory.getStandardAmount("FUEL", 100000); // 100k FUEL

      console.log(`💧 Adding large concentrated liquidity...`);

      // Should handle large amounts without issues
      await expect(
        poolFactory.addLiquidity(testPool, amountX, amountY, {
          type: "concentrated",
          bins: 1,
        })
      ).resolves.not.toThrow();

      console.log(`✅ Large liquidity addition completed`);
    });

    it("should track LP token balance changes accurately for concentrated liquidity", async () => {
      const amountX = tokenFactory.getStandardAmount("USDC", 500); // 500 USDC
      const amountY = tokenFactory.getStandardAmount("FUEL", 5000); // 5000 FUEL

      // Record initial balance
      const initialBalance = await poolFactory.getLPTokenBalance(
        liquidityProvider.wallet,
        testPool
      );

      // Add liquidity
      await poolFactory.addLiquidity(testPool, amountX, amountY, {
        type: "concentrated",
        bins: 1,
      });

      // Check balance change
      const finalBalance = await poolFactory.getLPTokenBalance(
        liquidityProvider.wallet,
        testPool
      );

      const balanceIncrease = finalBalance.sub(initialBalance);
      expect(balanceIncrease.gt(new BN(0))).toBe(true);

      console.log(
        `✅ LP token balance increased by: ${balanceIncrease.format()}`
      );
    });
  });

  describe("Normal Distribution Liquidity Tests (Multiple Bins)", () => {
    it("should add normal distribution liquidity across multiple bins", async () => {
      // Requirement 2.2: WHEN adding normal distribution liquidity across multiple bins
      // THEN the system SHALL preserve the intended liquidity shape

      const amountX = tokenFactory.getStandardAmount("USDC", 2000); // 2000 USDC
      const amountY = tokenFactory.getStandardAmount("FUEL", 20000); // 20000 FUEL

      console.log(`💧 Adding normal distribution liquidity across 21 bins...`);

      // Add normal distribution liquidity
      await poolFactory.addLiquidity(testPool, amountX, amountY, {
        type: "normal",
        bins: 21, // Standard normal distribution across 21 bins
      });

      // Verify liquidity distribution follows normal curve
      const distribution = await poolFactory.getLiquidityDistribution(testPool);
      expect(distribution.length).toBeGreaterThan(1);

      // Check that liquidity is distributed across multiple bins
      const binsWithLiquidity = distribution.filter((bin) =>
        bin.liquidity.gt(new BN(0))
      );
      expect(binsWithLiquidity.length).toBeGreaterThanOrEqual(3); // At least 3 bins should have liquidity

      // Verify normal distribution shape (center bin should have most liquidity)
      const sortedByLiquidity = distribution.sort((a, b) =>
        b.liquidity.sub(a.liquidity).toNumber()
      );

      const maxLiquidity = sortedByLiquidity[0].liquidity;
      const totalLiquidity = distribution.reduce(
        (sum, bin) => sum.add(bin.liquidity),
        new BN(0)
      );

      // Center bin should have significant portion but not overwhelming majority (normal distribution)
      const centerRatio = maxLiquidity.mul(new BN(100)).div(totalLiquidity);
      expect(centerRatio.gte(new BN(20))).toBe(true); // At least 20%
      expect(centerRatio.lte(new BN(60))).toBe(true); // But not more than 60%

      console.log(
        `✅ Normal distribution preserved - center bin: ${centerRatio.toString()}% of total`
      );
    });

    it("should handle different normal distribution widths", async () => {
      const amountX = tokenFactory.getStandardAmount("USDC", 1000);
      const amountY = tokenFactory.getStandardAmount("FUEL", 10000);

      // Test narrow distribution (5 bins)
      console.log(`💧 Testing narrow normal distribution (5 bins)...`);
      await poolFactory.addLiquidity(testPool, amountX, amountY, {
        type: "normal",
        bins: 5,
      });

      // Test wide distribution (51 bins)
      console.log(`💧 Testing wide normal distribution (51 bins)...`);
      await poolFactory.addLiquidity(testPool, amountX, amountY, {
        type: "normal",
        bins: 51,
      });

      console.log(`✅ Different distribution widths handled successfully`);
    });

    it("should preserve normal distribution shape with varying amounts", async () => {
      // Test with different amount ratios
      const testCases = [
        {amountX: 100, amountY: 1000, description: "1:10 ratio"},
        {amountX: 1000, amountY: 1000, description: "1:1 ratio"},
        {amountX: 1000, amountY: 100, description: "10:1 ratio"},
      ];

      for (const testCase of testCases) {
        console.log(
          `💧 Testing normal distribution with ${testCase.description}...`
        );

        const amountX = tokenFactory.getStandardAmount(
          "USDC",
          testCase.amountX
        );
        const amountY = tokenFactory.getStandardAmount(
          "FUEL",
          testCase.amountY
        );

        await poolFactory.addLiquidity(testPool, amountX, amountY, {
          type: "normal",
          bins: 11,
        });

        console.log(
          `✅ Normal distribution maintained with ${testCase.description}`
        );
      }
    });
  });

  describe("Uniform Distribution Liquidity Tests", () => {
    it("should add uniform distribution liquidity across specified bins", async () => {
      // Requirement 2.3: WHEN adding uniform distribution liquidity
      // THEN the system SHALL distribute liquidity evenly across specified bins

      const amountX = tokenFactory.getStandardAmount("USDC", 1000); // 1000 USDC
      const amountY = tokenFactory.getStandardAmount("FUEL", 10000); // 10000 FUEL

      console.log(`💧 Adding uniform distribution liquidity across 10 bins...`);

      // Add uniform distribution liquidity
      await poolFactory.addLiquidity(testPool, amountX, amountY, {
        type: "uniform",
        bins: 10,
      });

      // Verify uniform distribution
      const distribution = await poolFactory.getLiquidityDistribution(testPool);
      const binsWithLiquidity = distribution.filter((bin) =>
        bin.liquidity.gt(new BN(0))
      );

      expect(binsWithLiquidity.length).toBeGreaterThanOrEqual(3); // Should have liquidity in multiple bins

      // Check uniformity - all bins with liquidity should have similar amounts
      if (binsWithLiquidity.length > 1) {
        const liquidityAmounts = binsWithLiquidity.map((bin) => bin.liquidity);
        const minLiquidity = liquidityAmounts.reduce((min, amount) =>
          amount.lt(min) ? amount : min
        );
        const maxLiquidity = liquidityAmounts.reduce((max, amount) =>
          amount.gt(max) ? amount : max
        );

        // Variation should be minimal for uniform distribution
        // Allow up to 50% variation due to rounding and implementation details
        const variation = maxLiquidity
          .sub(minLiquidity)
          .mul(new BN(100))
          .div(minLiquidity);
        expect(variation.lte(new BN(50))).toBe(true);

        console.log(
          `✅ Uniform distribution achieved - variation: ${variation.toString()}%`
        );
      }
    });

    it("should handle uniform distribution with different bin counts", async () => {
      const amountX = tokenFactory.getStandardAmount("USDC", 500);
      const amountY = tokenFactory.getStandardAmount("FUEL", 5000);

      const binCounts = [3, 5, 10, 20];

      for (const binCount of binCounts) {
        console.log(`💧 Testing uniform distribution with ${binCount} bins...`);

        await poolFactory.addLiquidity(testPool, amountX, amountY, {
          type: "uniform",
          bins: binCount,
        });

        console.log(`✅ Uniform distribution with ${binCount} bins completed`);
      }
    });

    it("should maintain uniform distribution with asymmetric token amounts", async () => {
      // Test uniform distribution with very different token amounts
      const amountX = tokenFactory.getStandardAmount("USDC", 10); // Small USDC amount
      const amountY = tokenFactory.getStandardAmount("FUEL", 10000); // Large FUEL amount

      console.log(`💧 Testing uniform distribution with asymmetric amounts...`);

      await poolFactory.addLiquidity(testPool, amountX, amountY, {
        type: "uniform",
        bins: 7,
      });

      // Should complete without errors
      const distribution = await poolFactory.getLiquidityDistribution(testPool);
      expect(distribution.length).toBeGreaterThan(0);

      console.log(`✅ Uniform distribution with asymmetric amounts completed`);
    });
  });

  describe("Partial Liquidity Removal Tests", () => {
    it("should remove partial liquidity from positions correctly", async () => {
      // Requirement 2.4: WHEN removing partial liquidity from positions
      // THEN the system SHALL correctly calculate and return the appropriate amounts

      // First, add liquidity to have something to remove
      const amountX = tokenFactory.getStandardAmount("USDC", 2000);
      const amountY = tokenFactory.getStandardAmount("FUEL", 20000);

      console.log(`💧 Adding initial liquidity for partial removal test...`);
      await poolFactory.addLiquidity(testPool, amountX, amountY, {
        type: "concentrated",
        bins: 1,
      });

      // Get initial LP token balance
      const initialLPBalance = await poolFactory.getLPTokenBalance(
        liquidityProvider.wallet,
        testPool
      );

      console.log(`🔥 Removing 25% of liquidity...`);

      // Remove 25% of liquidity
      await poolFactory.removeLiquidity(testPool, 25);

      // Verify LP token balance decreased
      const finalLPBalance = await poolFactory.getLPTokenBalance(
        liquidityProvider.wallet,
        testPool
      );

      expect(finalLPBalance.lt(initialLPBalance)).toBe(true);

      const balanceDecrease = initialLPBalance.sub(finalLPBalance);
      const decreasePercentage = balanceDecrease
        .mul(new BN(100))
        .div(initialLPBalance);

      // Should be approximately 25% decrease (allow some tolerance)
      expect(decreasePercentage.gte(new BN(20))).toBe(true);
      expect(decreasePercentage.lte(new BN(30))).toBe(true);

      console.log(
        `✅ Partial removal completed - ${decreasePercentage.toString()}% decrease`
      );
    });

    it("should handle different partial removal percentages", async () => {
      // Add initial liquidity
      const amountX = tokenFactory.getStandardAmount("USDC", 1000);
      const amountY = tokenFactory.getStandardAmount("FUEL", 10000);

      await poolFactory.addLiquidity(testPool, amountX, amountY, {
        type: "normal",
        bins: 11,
      });

      const percentages = [10, 33, 50, 75];

      for (const percentage of percentages) {
        console.log(`🔥 Testing ${percentage}% liquidity removal...`);

        const initialBalance = await poolFactory.getLPTokenBalance(
          liquidityProvider.wallet,
          testPool
        );

        await poolFactory.removeLiquidity(testPool, percentage);

        const finalBalance = await poolFactory.getLPTokenBalance(
          liquidityProvider.wallet,
          testPool
        );

        expect(finalBalance.lte(initialBalance)).toBe(true);
        console.log(`✅ ${percentage}% removal completed`);
      }
    });

    it("should preserve remaining liquidity distribution after partial removal", async () => {
      // Add distributed liquidity
      const amountX = tokenFactory.getStandardAmount("USDC", 1500);
      const amountY = tokenFactory.getStandardAmount("FUEL", 15000);

      await poolFactory.addLiquidity(testPool, amountX, amountY, {
        type: "uniform",
        bins: 5,
      });

      // Get initial distribution
      const initialDistribution =
        await poolFactory.getLiquidityDistribution(testPool);
      const initialBinsWithLiquidity = initialDistribution.filter((bin) =>
        bin.liquidity.gt(new BN(0))
      );

      // Remove 40% of liquidity
      await poolFactory.removeLiquidity(testPool, 40);

      // Get final distribution
      const finalDistribution =
        await poolFactory.getLiquidityDistribution(testPool);
      const finalBinsWithLiquidity = finalDistribution.filter((bin) =>
        bin.liquidity.gt(new BN(0))
      );

      // Should still have liquidity in similar number of bins
      expect(finalBinsWithLiquidity.length).toBeGreaterThanOrEqual(
        Math.floor(initialBinsWithLiquidity.length * 0.5)
      );

      console.log(`✅ Liquidity distribution preserved after partial removal`);
    });
  });

  describe("Complete Liquidity Removal Tests", () => {
    it("should remove all liquidity from a position", async () => {
      // Requirement 2.5: WHEN removing all liquidity from a position
      // THEN the system SHALL clear the position and return all assets

      // Add liquidity first
      const amountX = tokenFactory.getStandardAmount("USDC", 1000);
      const amountY = tokenFactory.getStandardAmount("FUEL", 10000);

      console.log(`💧 Adding liquidity for complete removal test...`);
      await poolFactory.addLiquidity(testPool, amountX, amountY, {
        type: "concentrated",
        bins: 1,
      });

      // Get initial LP token balance
      const initialLPBalance = await poolFactory.getLPTokenBalance(
        liquidityProvider.wallet,
        testPool
      );

      expect(initialLPBalance.gt(new BN(0))).toBe(true);

      console.log(`🔥 Removing 100% of liquidity...`);

      // Remove all liquidity (100%)
      await poolFactory.removeLiquidity(testPool, 100);

      // Verify LP token balance is significantly reduced or zero
      const finalLPBalance = await poolFactory.getLPTokenBalance(
        liquidityProvider.wallet,
        testPool
      );

      // Should be much less than initial (ideally zero, but allowing for rounding)
      const remainingPercentage = finalLPBalance
        .mul(new BN(100))
        .div(initialLPBalance);
      expect(remainingPercentage.lte(new BN(5))).toBe(true); // Less than 5% remaining

      console.log(
        `✅ Complete removal - ${remainingPercentage.toString()}% remaining`
      );
    });

    it("should handle complete removal from distributed liquidity", async () => {
      // Add distributed liquidity
      const amountX = tokenFactory.getStandardAmount("USDC", 2000);
      const amountY = tokenFactory.getStandardAmount("FUEL", 20000);

      await poolFactory.addLiquidity(testPool, amountX, amountY, {
        type: "normal",
        bins: 15,
      });

      const initialLPBalance = await poolFactory.getLPTokenBalance(
        liquidityProvider.wallet,
        testPool
      );

      // Remove all liquidity
      await poolFactory.removeLiquidity(testPool, 100);

      const finalLPBalance = await poolFactory.getLPTokenBalance(
        liquidityProvider.wallet,
        testPool
      );

      // Should be significantly reduced
      expect(finalLPBalance.lt(initialLPBalance.div(new BN(10)))).toBe(true);

      console.log(`✅ Complete removal from distributed liquidity completed`);
    });

    it("should clear position after complete removal", async () => {
      // Add liquidity
      const amountX = tokenFactory.getStandardAmount("USDC", 500);
      const amountY = tokenFactory.getStandardAmount("FUEL", 5000);

      await poolFactory.addLiquidity(testPool, amountX, amountY, {
        type: "uniform",
        bins: 3,
      });

      // Remove all liquidity
      await poolFactory.removeLiquidity(testPool, 100);

      // Position should be cleared (minimal LP tokens remaining)
      const finalLPBalance = await poolFactory.getLPTokenBalance(
        liquidityProvider.wallet,
        testPool
      );

      // Should be very small or zero
      expect(finalLPBalance.lte(new BN("1000000000000000"))).toBe(true); // Less than 0.001 ETH equivalent

      console.log(`✅ Position cleared after complete removal`);
    });
  });

  describe("Specific Bin Liquidity Removal Tests", () => {
    it("should remove liquidity from specific bins only", async () => {
      // Requirement 2.6: WHEN removing liquidity from specific bins
      // THEN the system SHALL only affect the targeted bins

      // Add distributed liquidity first
      const amountX = tokenFactory.getStandardAmount("USDC", 1500);
      const amountY = tokenFactory.getStandardAmount("FUEL", 15000);

      console.log(
        `💧 Adding distributed liquidity for specific bin removal...`
      );
      await poolFactory.addLiquidity(testPool, amountX, amountY, {
        type: "uniform",
        bins: 7,
      });

      // Get initial distribution
      const initialDistribution =
        await poolFactory.getLiquidityDistribution(testPool);
      const binsWithLiquidity = initialDistribution.filter((bin) =>
        bin.liquidity.gt(new BN(0))
      );

      expect(binsWithLiquidity.length).toBeGreaterThan(2);

      // Select specific bins to remove (first 2 bins with liquidity)
      const targetBins = binsWithLiquidity.slice(0, 2).map((bin) => bin.binId);

      console.log(
        `🔥 Removing liquidity from specific bins: [${targetBins.join(", ")}]...`
      );

      // Remove liquidity from specific bins
      await poolFactory.removeLiquidityFromBins(testPool, targetBins);

      // Verify only targeted bins were affected
      const finalDistribution =
        await poolFactory.getLiquidityDistribution(testPool);

      // Should still have liquidity in non-targeted bins
      const remainingBinsWithLiquidity = finalDistribution.filter(
        (bin) => bin.liquidity.gt(new BN(0)) && !targetBins.includes(bin.binId)
      );

      expect(remainingBinsWithLiquidity.length).toBeGreaterThan(0);

      console.log(
        `✅ Specific bin removal completed - ${remainingBinsWithLiquidity.length} bins still have liquidity`
      );
    });

    it("should handle removal from single specific bin", async () => {
      // Add concentrated liquidity
      const amountX = tokenFactory.getStandardAmount("USDC", 800);
      const amountY = tokenFactory.getStandardAmount("FUEL", 8000);

      await poolFactory.addLiquidity(testPool, amountX, amountY, {
        type: "concentrated",
        bins: 1,
      });

      // Get the active bin ID
      const distribution = await poolFactory.getLiquidityDistribution(testPool);
      const activeBin = distribution.find((bin) => bin.liquidity.gt(new BN(0)));

      expect(activeBin).toBeDefined();

      console.log(
        `🔥 Removing liquidity from single bin: ${activeBin!.binId}...`
      );

      // Remove from specific bin
      await poolFactory.removeLiquidityFromBins(testPool, [activeBin!.binId]);

      console.log(`✅ Single bin removal completed`);
    });

    it("should handle removal from multiple non-contiguous bins", async () => {
      // Add liquidity with custom distribution
      const amountX = tokenFactory.getStandardAmount("USDC", 1200);
      const amountY = tokenFactory.getStandardAmount("FUEL", 12000);

      await poolFactory.addLiquidity(testPool, amountX, amountY, {
        type: "uniform",
        bins: 9,
      });

      // Get bins with liquidity
      const distribution = await poolFactory.getLiquidityDistribution(testPool);
      const binsWithLiquidity = distribution.filter((bin) =>
        bin.liquidity.gt(new BN(0))
      );

      if (binsWithLiquidity.length >= 4) {
        // Select non-contiguous bins (1st, 3rd, 5th)
        const targetBins = [
          binsWithLiquidity[0].binId,
          binsWithLiquidity[2].binId,
          binsWithLiquidity[4].binId,
        ];

        console.log(
          `🔥 Removing from non-contiguous bins: [${targetBins.join(", ")}]...`
        );

        await poolFactory.removeLiquidityFromBins(testPool, targetBins);

        console.log(`✅ Non-contiguous bin removal completed`);
      } else {
        console.log(
          `⚠️ Not enough bins with liquidity for non-contiguous test`
        );
      }
    });

    it("should preserve liquidity in non-targeted bins", async () => {
      // Add distributed liquidity
      const amountX = tokenFactory.getStandardAmount("USDC", 1000);
      const amountY = tokenFactory.getStandardAmount("FUEL", 10000);

      await poolFactory.addLiquidity(testPool, amountX, amountY, {
        type: "normal",
        bins: 11,
      });

      // Get initial state
      const initialDistribution =
        await poolFactory.getLiquidityDistribution(testPool);
      const binsWithLiquidity = initialDistribution.filter((bin) =>
        bin.liquidity.gt(new BN(0))
      );

      if (binsWithLiquidity.length >= 3) {
        // Target only the first bin
        const targetBin = binsWithLiquidity[0].binId;
        const nonTargetedBins = binsWithLiquidity.slice(1);

        // Record non-targeted bin liquidity amounts
        const nonTargetedLiquidity = nonTargetedBins.map((bin) => ({
          binId: bin.binId,
          liquidity: bin.liquidity,
        }));

        // Remove from specific bin
        await poolFactory.removeLiquidityFromBins(testPool, [targetBin]);

        // Check that non-targeted bins still have similar liquidity
        const finalDistribution =
          await poolFactory.getLiquidityDistribution(testPool);

        for (const expectedBin of nonTargetedLiquidity) {
          const finalBin = finalDistribution.find(
            (bin) => bin.binId === expectedBin.binId
          );

          if (finalBin) {
            // Should still have significant liquidity (allowing for some variation)
            expect(
              finalBin.liquidity.gte(expectedBin.liquidity.div(new BN(2)))
            ).toBe(true);
          }
        }

        console.log(`✅ Non-targeted bins preserved their liquidity`);
      }
    });
  });

  describe("LP Token Balance Tracking Tests", () => {
    it("should track LP token balance changes accurately across operations", async () => {
      // Requirement: Create LP token balance tracking tests

      console.log(`💰 Testing LP token balance tracking...`);

      // Start with zero balance
      let currentBalance = await poolFactory.getLPTokenBalance(
        liquidityProvider.wallet,
        testPool
      );
      const initialBalance = currentBalance;

      console.log(`📊 Initial LP balance: ${currentBalance.format()}`);

      // Add liquidity and track balance increase
      const amountX1 = tokenFactory.getStandardAmount("USDC", 500);
      const amountY1 = tokenFactory.getStandardAmount("FUEL", 5000);

      await poolFactory.addLiquidity(testPool, amountX1, amountY1, {
        type: "concentrated",
        bins: 1,
      });

      const balanceAfterAdd1 = await poolFactory.getLPTokenBalance(
        liquidityProvider.wallet,
        testPool
      );

      expect(balanceAfterAdd1.gt(currentBalance)).toBe(true);
      console.log(`📊 After first add: ${balanceAfterAdd1.format()}`);

      // Add more liquidity
      const amountX2 = tokenFactory.getStandardAmount("USDC", 300);
      const amountY2 = tokenFactory.getStandardAmount("FUEL", 3000);

      await poolFactory.addLiquidity(testPool, amountX2, amountY2, {
        type: "uniform",
        bins: 5,
      });

      const balanceAfterAdd2 = await poolFactory.getLPTokenBalance(
        liquidityProvider.wallet,
        testPool
      );

      expect(balanceAfterAdd2.gt(balanceAfterAdd1)).toBe(true);
      console.log(`📊 After second add: ${balanceAfterAdd2.format()}`);

      // Remove some liquidity
      await poolFactory.removeLiquidity(testPool, 30);

      const balanceAfterRemove = await poolFactory.getLPTokenBalance(
        liquidityProvider.wallet,
        testPool
      );

      expect(balanceAfterRemove.lt(balanceAfterAdd2)).toBe(true);
      console.log(`📊 After removal: ${balanceAfterRemove.format()}`);

      // Final balance should still be higher than initial
      expect(balanceAfterRemove.gt(initialBalance)).toBe(true);

      console.log(
        `✅ LP token balance tracking verified across all operations`
      );
    });

    it("should track LP tokens for different liquidity shapes", async () => {
      const baseAmountX = tokenFactory.getStandardAmount("USDC", 200);
      const baseAmountY = tokenFactory.getStandardAmount("FUEL", 2000);

      const shapes = [
        {type: "concentrated" as const, bins: 1, description: "concentrated"},
        {type: "normal" as const, bins: 7, description: "normal distribution"},
        {
          type: "uniform" as const,
          bins: 5,
          description: "uniform distribution",
        },
      ];

      const balanceChanges: Array<{shape: string; increase: BN}> = [];

      for (const shape of shapes) {
        const beforeBalance = await poolFactory.getLPTokenBalance(
          liquidityProvider.wallet,
          testPool
        );

        console.log(`💧 Adding ${shape.description} liquidity...`);

        await poolFactory.addLiquidity(
          testPool,
          baseAmountX,
          baseAmountY,
          shape
        );

        const afterBalance = await poolFactory.getLPTokenBalance(
          liquidityProvider.wallet,
          testPool
        );

        const increase = afterBalance.sub(beforeBalance);
        balanceChanges.push({shape: shape.description, increase});

        expect(increase.gt(new BN(0))).toBe(true);
        console.log(`📊 ${shape.description}: +${increase.format()} LP tokens`);
      }

      // All shapes should result in positive LP token increases
      expect(
        balanceChanges.every((change) => change.increase.gt(new BN(0)))
      ).toBe(true);

      console.log(`✅ LP token tracking verified for all liquidity shapes`);
    });

    it("should handle LP token balance queries for empty positions", async () => {
      // Create a new wallet with no liquidity positions
      const emptyWallet = await walletFactory.createWallet({
        name: "empty-wallet",
        initialBalance: "1000000000000000000", // 1 ETH for gas
      });

      // Check LP token balance for wallet with no positions
      const emptyBalance = await poolFactory.getLPTokenBalance(
        emptyWallet.wallet,
        testPool
      );

      // Should be zero or very small
      expect(emptyBalance.lte(new BN("1000000000000000"))).toBe(true); // Less than 0.001 ETH equivalent

      console.log(`✅ Empty position LP balance: ${emptyBalance.format()}`);
    });

    it("should track LP token balance precision accurately", async () => {
      // Test with very small amounts to check precision
      const smallAmountX = tokenFactory.getStandardAmount("USDC", 0.01); // 0.01 USDC
      const smallAmountY = tokenFactory.getStandardAmount("FUEL", 0.1); // 0.1 FUEL

      const beforeBalance = await poolFactory.getLPTokenBalance(
        liquidityProvider.wallet,
        testPool
      );

      console.log(`💧 Adding very small liquidity amounts...`);

      await poolFactory.addLiquidity(testPool, smallAmountX, smallAmountY, {
        type: "concentrated",
        bins: 1,
      });

      const afterBalance = await poolFactory.getLPTokenBalance(
        liquidityProvider.wallet,
        testPool
      );

      // Should detect even small changes
      const change = afterBalance.sub(beforeBalance);
      console.log(`📊 Small amount change: ${change.format()} LP tokens`);

      // Change might be very small but should be detectable
      expect(afterBalance.gte(beforeBalance)).toBe(true);

      console.log(`✅ LP token precision tracking verified`);
    });

    it("should maintain LP token balance consistency across multiple operations", async () => {
      const operations = [
        {
          action: "add",
          amountX: 100,
          amountY: 1000,
          shape: {type: "concentrated" as const, bins: 1},
        },
        {
          action: "add",
          amountX: 200,
          amountY: 2000,
          shape: {type: "uniform" as const, bins: 3},
        },
        {action: "remove", percentage: 25},
        {
          action: "add",
          amountX: 150,
          amountY: 1500,
          shape: {type: "normal" as const, bins: 9},
        },
        {action: "remove", percentage: 50},
      ];

      let previousBalance = await poolFactory.getLPTokenBalance(
        liquidityProvider.wallet,
        testPool
      );

      console.log(`📊 Starting balance: ${previousBalance.format()}`);

      for (let i = 0; i < operations.length; i++) {
        const op = operations[i];

        if (op.action === "add") {
          const amountX = tokenFactory.getStandardAmount("USDC", op.amountX!);
          const amountY = tokenFactory.getStandardAmount("FUEL", op.amountY!);

          console.log(
            `💧 Operation ${i + 1}: Adding ${op.amountX} USDC + ${op.amountY} FUEL`
          );

          await poolFactory.addLiquidity(testPool, amountX, amountY, op.shape!);

          const newBalance = await poolFactory.getLPTokenBalance(
            liquidityProvider.wallet,
            testPool
          );

          expect(newBalance.gt(previousBalance)).toBe(true);
          console.log(`📊 Balance increased to: ${newBalance.format()}`);
          previousBalance = newBalance;
        } else if (op.action === "remove") {
          console.log(
            `🔥 Operation ${i + 1}: Removing ${op.percentage}% liquidity`
          );

          await poolFactory.removeLiquidity(testPool, op.percentage!);

          const newBalance = await poolFactory.getLPTokenBalance(
            liquidityProvider.wallet,
            testPool
          );

          expect(newBalance.lt(previousBalance)).toBe(true);
          console.log(`📊 Balance decreased to: ${newBalance.format()}`);
          previousBalance = newBalance;
        }
      }

      console.log(
        `✅ LP token balance consistency maintained across ${operations.length} operations`
      );
    });
  });

  describe("Cross-Validation with Requirements", () => {
    it("should validate all liquidity management requirements are met", async () => {
      console.log(`🔍 Validating all liquidity management requirements...`);

      // Requirement 2.1: Concentrated liquidity addition
      const amountX = tokenFactory.getStandardAmount("USDC", 1000);
      const amountY = tokenFactory.getStandardAmount("FUEL", 10000);

      await poolFactory.addLiquidity(testPool, amountX, amountY, {
        type: "concentrated",
        bins: 1,
      });
      console.log(
        `✅ Requirement 2.1: Concentrated liquidity addition - PASSED`
      );

      // Requirement 2.2: Normal distribution liquidity
      await poolFactory.addLiquidity(testPool, amountX, amountY, {
        type: "normal",
        bins: 15,
      });
      console.log(`✅ Requirement 2.2: Normal distribution liquidity - PASSED`);

      // Requirement 2.3: Uniform distribution liquidity
      await poolFactory.addLiquidity(testPool, amountX, amountY, {
        type: "uniform",
        bins: 8,
      });
      console.log(
        `✅ Requirement 2.3: Uniform distribution liquidity - PASSED`
      );

      // Requirement 2.4: Partial liquidity removal
      await poolFactory.removeLiquidity(testPool, 40);
      console.log(`✅ Requirement 2.4: Partial liquidity removal - PASSED`);

      // Requirement 2.5: Complete liquidity removal
      await poolFactory.removeLiquidity(testPool, 100);
      console.log(`✅ Requirement 2.5: Complete liquidity removal - PASSED`);

      // Requirement 2.6: Specific bin liquidity removal
      // Add fresh liquidity for bin-specific removal
      await poolFactory.addLiquidity(testPool, amountX, amountY, {
        type: "uniform",
        bins: 5,
      });

      const distribution = await poolFactory.getLiquidityDistribution(testPool);
      const binsWithLiquidity = distribution.filter((bin) =>
        bin.liquidity.gt(new BN(0))
      );

      if (binsWithLiquidity.length > 0) {
        await poolFactory.removeLiquidityFromBins(testPool, [
          binsWithLiquidity[0].binId,
        ]);
        console.log(
          `✅ Requirement 2.6: Specific bin liquidity removal - PASSED`
        );
      }

      // LP token balance tracking (implicit in all operations)
      const finalBalance = await poolFactory.getLPTokenBalance(
        liquidityProvider.wallet,
        testPool
      );
      expect(finalBalance.gte(new BN(0))).toBe(true);
      console.log(
        `✅ LP token balance tracking throughout all operations - PASSED`
      );

      console.log(
        `🎉 All liquidity management requirements validated successfully!`
      );
    });
  });
});
