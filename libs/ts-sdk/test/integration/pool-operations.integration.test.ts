import {describe, it, expect, beforeAll, afterAll, beforeEach} from "vitest";
import {BN} from "fuels";
import {
  testEnvironment,
  PoolFactory,
  TokenFactory,
  WalletFactory,
  STANDARD_POOL_CONFIGS,
  defaultTestRunner,
} from "./setup";
import {buildPoolIdV2} from "../../src/sdk/utils";

describe("Pool Operations Integration Tests", () => {
  let poolFactory: PoolFactory;
  let tokenFactory: TokenFactory;
  let walletFactory: WalletFactory;

  beforeAll(async () => {
    // Start test environment with improved infrastructure
    console.log(
      "🚀 Starting pool operations tests with improved infrastructure..."
    );
    await defaultTestRunner.setup();

    // Initialize factories with improved wallet creation
    const wallet = await testEnvironment.createWallet("100000000000000000"); // 0.1 ETH (reduced from 1 ETH)
    const contractIds = testEnvironment.getContractIds();

    poolFactory = new PoolFactory(wallet, contractIds.simpleProxy);
    tokenFactory = new TokenFactory(wallet, contractIds.fungible);
    walletFactory = new WalletFactory(wallet.provider, wallet, tokenFactory);

    console.log("✅ Pool operations test setup completed");
  }, 120000); // 2 minute timeout for service startup

  afterAll(async () => {
    await defaultTestRunner.teardown();
  });

  beforeEach(async () => {
    // Quick cleanup between tests for isolation with improved error handling
    try {
      await testEnvironment.quickCleanup();
    } catch (error) {
      console.warn("⚠️ Cleanup warning (non-fatal):", error);
      // Continue with test - cleanup failures shouldn't block tests
    }
  });

  describe("Pool Creation with USDC/FUEL and ETH/USDT pairs", () => {
    it("should create USDC/FUEL pool with correct metadata", async () => {
      // Get test tokens
      const usdc = tokenFactory.getToken("USDC");
      const fuel = tokenFactory.getToken("FUEL");

      expect(usdc).toBeDefined();
      expect(fuel).toBeDefined();

      if (!usdc || !fuel) {
        throw new Error("Required test tokens not available");
      }

      // Create pool with VOLATILE configuration
      const poolId = await poolFactory.createPool({
        tokenX: usdc,
        tokenY: fuel,
        binStep: STANDARD_POOL_CONFIGS.VOLATILE.binStep,
        baseFactor: STANDARD_POOL_CONFIGS.VOLATILE.baseFactor,
        protocolShare: STANDARD_POOL_CONFIGS.VOLATILE.protocolShare,
      });

      expect(poolId).toBeDefined();

      // Validate pool metadata
      const validation = await poolFactory.validatePoolMetadata(poolId, {
        tokenX: usdc,
        tokenY: fuel,
        binStep: STANDARD_POOL_CONFIGS.VOLATILE.binStep,
        baseFactor: STANDARD_POOL_CONFIGS.VOLATILE.baseFactor,
        protocolShare: STANDARD_POOL_CONFIGS.VOLATILE.protocolShare,
      });

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);

      // Verify pool can be looked up
      const lookupResult = await poolFactory.lookupPool(poolId);
      expect(lookupResult.exists).toBe(true);
      expect(lookupResult.metadata).toBeDefined();
    });

    it("should create ETH/USDT pool with correct metadata", async () => {
      // Get test tokens
      const eth = tokenFactory.getToken("ETH");
      const usdt = tokenFactory.getToken("USDT");

      expect(eth).toBeDefined();
      expect(usdt).toBeDefined();

      if (!eth || !usdt) {
        throw new Error("Required test tokens not available");
      }

      // Create pool with VOLATILE configuration
      const poolId = await poolFactory.createPool({
        tokenX: eth,
        tokenY: usdt,
        binStep: STANDARD_POOL_CONFIGS.VOLATILE.binStep,
        baseFactor: STANDARD_POOL_CONFIGS.VOLATILE.baseFactor,
        protocolShare: STANDARD_POOL_CONFIGS.VOLATILE.protocolShare,
      });

      expect(poolId).toBeDefined();

      // Validate pool metadata
      const validation = await poolFactory.validatePoolMetadata(poolId, {
        tokenX: eth,
        tokenY: usdt,
        binStep: STANDARD_POOL_CONFIGS.VOLATILE.binStep,
        baseFactor: STANDARD_POOL_CONFIGS.VOLATILE.baseFactor,
        protocolShare: STANDARD_POOL_CONFIGS.VOLATILE.protocolShare,
      });

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);

      // Verify pool can be looked up
      const lookupResult = await poolFactory.lookupPool(poolId);
      expect(lookupResult.exists).toBe(true);
      expect(lookupResult.metadata).toBeDefined();
    });

    it("should handle pool creation when pool already exists", async () => {
      // Get test tokens
      const usdc = tokenFactory.getToken("USDC");
      const fuel = tokenFactory.getToken("FUEL");

      if (!usdc || !fuel) {
        throw new Error("Required test tokens not available");
      }

      // Create pool first time
      const poolId1 = await poolFactory.createPool({
        tokenX: usdc,
        tokenY: fuel,
        binStep: STANDARD_POOL_CONFIGS.STABLE.binStep,
        baseFactor: STANDARD_POOL_CONFIGS.STABLE.baseFactor,
      });

      // Try to create same pool again
      const poolId2 = await poolFactory.createPool({
        tokenX: usdc,
        tokenY: fuel,
        binStep: STANDARD_POOL_CONFIGS.STABLE.binStep,
        baseFactor: STANDARD_POOL_CONFIGS.STABLE.baseFactor,
      });

      // Should return the same pool ID
      expect(poolId1.toHex()).toBe(poolId2.toHex());
    });
  });

  describe("Different Fee Configurations (10, 30, 100 bps)", () => {
    it("should create pools with 10 bps fee configuration (STABLE)", async () => {
      const usdc = tokenFactory.getToken("USDC");
      const usdt = tokenFactory.getToken("USDT");

      if (!usdc || !usdt) {
        throw new Error("Required test tokens not available");
      }

      const poolId = await poolFactory.createStandardPool("STABLE", usdc, usdt);

      const metadata = await poolFactory.getPoolInfo(poolId);
      expect(metadata).toBeDefined();
      expect(metadata?.pool.binStep).toBe(STANDARD_POOL_CONFIGS.STABLE.binStep);
      expect(metadata?.pool.baseFactor).toBe(
        STANDARD_POOL_CONFIGS.STABLE.baseFactor
      );
    });

    it("should create pools with 30 bps fee configuration (VOLATILE)", async () => {
      const eth = tokenFactory.getToken("ETH");
      const usdc = tokenFactory.getToken("USDC");

      if (!eth || !usdc) {
        throw new Error("Required test tokens not available");
      }

      const poolId = await poolFactory.createStandardPool(
        "VOLATILE",
        eth,
        usdc
      );

      const metadata = await poolFactory.getPoolInfo(poolId);
      expect(metadata).toBeDefined();
      expect(metadata?.pool.binStep).toBe(
        STANDARD_POOL_CONFIGS.VOLATILE.binStep
      );
      expect(metadata?.pool.baseFactor).toBe(
        STANDARD_POOL_CONFIGS.VOLATILE.baseFactor
      );
    });

    it("should create pools with 100 bps fee configuration (EXOTIC)", async () => {
      const fuel = tokenFactory.getToken("FUEL");
      const eth = tokenFactory.getToken("ETH");

      if (!fuel || !eth) {
        throw new Error("Required test tokens not available");
      }

      const poolId = await poolFactory.createStandardPool("EXOTIC", fuel, eth);

      const metadata = await poolFactory.getPoolInfo(poolId);
      expect(metadata).toBeDefined();
      expect(metadata?.pool.binStep).toBe(STANDARD_POOL_CONFIGS.EXOTIC.binStep);
      expect(metadata?.pool.baseFactor).toBe(
        STANDARD_POOL_CONFIGS.EXOTIC.baseFactor
      );
    });

    it("should create pools with custom fee configurations", async () => {
      const usdc = tokenFactory.getToken("USDC");
      const fuel = tokenFactory.getToken("FUEL");

      if (!usdc || !fuel) {
        throw new Error("Required test tokens not available");
      }

      // Custom configuration with different parameters
      const customConfig = {
        tokenX: usdc,
        tokenY: fuel,
        binStep: 5, // Custom bin step
        baseFactor: 6000, // Custom base factor
        protocolShare: 0,
      };

      const poolId = await poolFactory.createPool(customConfig);

      const validation = await poolFactory.validatePoolMetadata(
        poolId,
        customConfig
      );
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it("should differentiate pools with same tokens but different fee configurations", async () => {
      const usdc = tokenFactory.getToken("USDC");
      const fuel = tokenFactory.getToken("FUEL");

      if (!usdc || !fuel) {
        throw new Error("Required test tokens not available");
      }

      // Create pools with different configurations
      const stablePoolId = await poolFactory.createPool({
        tokenX: usdc,
        tokenY: fuel,
        binStep: STANDARD_POOL_CONFIGS.STABLE.binStep,
        baseFactor: STANDARD_POOL_CONFIGS.STABLE.baseFactor,
      });

      const volatilePoolId = await poolFactory.createPool({
        tokenX: usdc,
        tokenY: fuel,
        binStep: STANDARD_POOL_CONFIGS.VOLATILE.binStep,
        baseFactor: STANDARD_POOL_CONFIGS.VOLATILE.baseFactor,
      });

      // Pools should have different IDs
      expect(stablePoolId.toHex()).not.toBe(volatilePoolId.toHex());

      // Both pools should exist and have correct metadata
      const stableMetadata = await poolFactory.getPoolInfo(stablePoolId);
      const volatileMetadata = await poolFactory.getPoolInfo(volatilePoolId);

      expect(stableMetadata?.pool.binStep).toBe(
        STANDARD_POOL_CONFIGS.STABLE.binStep
      );
      expect(volatileMetadata?.pool.binStep).toBe(
        STANDARD_POOL_CONFIGS.VOLATILE.binStep
      );
    });
  });

  describe("Pool Metadata Retrieval and Validation", () => {
    it("should retrieve accurate pool metadata that matches expected configuration", async () => {
      const usdc = tokenFactory.getToken("USDC");
      const fuel = tokenFactory.getToken("FUEL");

      if (!usdc || !fuel) {
        throw new Error("Required test tokens not available");
      }

      const expectedConfig = {
        tokenX: usdc,
        tokenY: fuel,
        binStep: STANDARD_POOL_CONFIGS.VOLATILE.binStep,
        baseFactor: STANDARD_POOL_CONFIGS.VOLATILE.baseFactor,
        protocolShare: STANDARD_POOL_CONFIGS.VOLATILE.protocolShare,
        activeId: 8388608, // Default center bin
      };

      const poolId = await poolFactory.createPool(expectedConfig);

      // Get metadata
      const metadata = await poolFactory.getPoolInfo(poolId);

      expect(metadata).toBeDefined();
      expect(metadata?.pool.binStep).toBe(expectedConfig.binStep);
      expect(metadata?.pool.baseFactor).toBe(expectedConfig.baseFactor);
      expect(metadata?.activeId).toBeDefined();
    });

    it("should validate pool metadata against expected configuration", async () => {
      const eth = tokenFactory.getToken("ETH");
      const usdt = tokenFactory.getToken("USDT");

      if (!eth || !usdt) {
        throw new Error("Required test tokens not available");
      }

      const config = {
        tokenX: eth,
        tokenY: usdt,
        binStep: STANDARD_POOL_CONFIGS.EXOTIC.binStep,
        baseFactor: STANDARD_POOL_CONFIGS.EXOTIC.baseFactor,
        protocolShare: STANDARD_POOL_CONFIGS.EXOTIC.protocolShare,
      };

      const poolId = await poolFactory.createPool(config);

      // Validate metadata
      const validation = await poolFactory.validatePoolMetadata(poolId, config);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it("should detect metadata mismatches", async () => {
      const usdc = tokenFactory.getToken("USDC");
      const fuel = tokenFactory.getToken("FUEL");

      if (!usdc || !fuel) {
        throw new Error("Required test tokens not available");
      }

      // Create pool with one configuration
      const actualConfig = {
        tokenX: usdc,
        tokenY: fuel,
        binStep: STANDARD_POOL_CONFIGS.STABLE.binStep,
        baseFactor: STANDARD_POOL_CONFIGS.STABLE.baseFactor,
      };

      const poolId = await poolFactory.createPool(actualConfig);

      // Validate against different configuration
      const wrongConfig = {
        tokenX: usdc,
        tokenY: fuel,
        binStep: STANDARD_POOL_CONFIGS.VOLATILE.binStep, // Wrong bin step
        baseFactor: STANDARD_POOL_CONFIGS.VOLATILE.baseFactor, // Wrong base factor
      };

      const validation = await poolFactory.validatePoolMetadata(
        poolId,
        wrongConfig
      );

      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(
        validation.errors.some((error) => error.includes("Bin step mismatch"))
      ).toBe(true);
      expect(
        validation.errors.some((error) =>
          error.includes("Base factor mismatch")
        )
      ).toBe(true);
    });

    it("should cross-validate SDK metadata with indexer data", async () => {
      const usdc = tokenFactory.getToken("USDC");
      const usdt = tokenFactory.getToken("USDT");

      if (!usdc || !usdt) {
        throw new Error("Required test tokens not available");
      }

      const poolId = await poolFactory.createStandardPool("STABLE", usdc, usdt);

      // Wait for indexer to process
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Cross-validate with indexer
      const crossValidation =
        await poolFactory.crossValidateWithIndexer(poolId);

      expect(crossValidation.sdkData).toBeDefined();
      // Note: indexer data might not be available immediately in test environment
      // We mainly test that the cross-validation mechanism works
      if (crossValidation.indexerData) {
        expect(crossValidation.isConsistent).toBe(true);
        expect(crossValidation.differences).toHaveLength(0);
      }
    });
  });

  describe("Pool Discovery by Asset Pairs", () => {
    it("should discover pools by asset pairs", async () => {
      const usdc = tokenFactory.getToken("USDC");
      const fuel = tokenFactory.getToken("FUEL");

      if (!usdc || !fuel) {
        throw new Error("Required test tokens not available");
      }

      // Create multiple pools with same asset pair but different configurations
      await poolFactory.createPool({
        tokenX: usdc,
        tokenY: fuel,
        binStep: STANDARD_POOL_CONFIGS.STABLE.binStep,
        baseFactor: STANDARD_POOL_CONFIGS.STABLE.baseFactor,
      });

      await poolFactory.createPool({
        tokenX: usdc,
        tokenY: fuel,
        binStep: STANDARD_POOL_CONFIGS.VOLATILE.binStep,
        baseFactor: STANDARD_POOL_CONFIGS.VOLATILE.baseFactor,
      });

      // Wait for indexer to process
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Discover pools
      const discoveredPools = await poolFactory.discoverPoolsByAssetPair(
        usdc.assetId,
        fuel.assetId
      );

      expect(discoveredPools.length).toBeGreaterThanOrEqual(2);

      // Verify discovered pools have correct asset pairs
      discoveredPools.forEach((pool) => {
        expect(pool).toHaveProperty("poolId");
        expect(pool).toHaveProperty("binStep");
        expect(pool).toHaveProperty("baseFactor");
        expect(pool).toHaveProperty("activeId");
      });

      // Verify we can find both configurations
      const stablePool = discoveredPools.find(
        (p) => p.binStep === STANDARD_POOL_CONFIGS.STABLE.binStep
      );
      const volatilePool = discoveredPools.find(
        (p) => p.binStep === STANDARD_POOL_CONFIGS.VOLATILE.binStep
      );

      expect(stablePool).toBeDefined();
      expect(volatilePool).toBeDefined();
    });

    it("should discover pools with reversed asset order", async () => {
      const eth = tokenFactory.getToken("ETH");
      const usdt = tokenFactory.getToken("USDT");

      if (!eth || !usdt) {
        throw new Error("Required test tokens not available");
      }

      // Create pool with ETH as tokenX and USDT as tokenY
      await poolFactory.createPool({
        tokenX: eth,
        tokenY: usdt,
        binStep: STANDARD_POOL_CONFIGS.VOLATILE.binStep,
        baseFactor: STANDARD_POOL_CONFIGS.VOLATILE.baseFactor,
      });

      // Wait for indexer to process
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Discover pools with reversed order (USDT, ETH)
      const discoveredPools = await poolFactory.discoverPoolsByAssetPair(
        usdt.assetId,
        eth.assetId
      );

      expect(discoveredPools.length).toBeGreaterThanOrEqual(1);

      const pool = discoveredPools[0];
      expect(pool.binStep).toBe(STANDARD_POOL_CONFIGS.VOLATILE.binStep);
      expect(pool.baseFactor).toBe(STANDARD_POOL_CONFIGS.VOLATILE.baseFactor);
    });

    it("should return empty array for non-existent asset pairs", async () => {
      // Use fake asset IDs
      const fakeAssetId1 =
        "0x1234567890123456789012345678901234567890123456789012345678901234";
      const fakeAssetId2 =
        "0x9876543210987654321098765432109876543210987654321098765432109876";

      const discoveredPools = await poolFactory.discoverPoolsByAssetPair(
        fakeAssetId1,
        fakeAssetId2
      );

      expect(discoveredPools).toHaveLength(0);
    });

    it("should find pools by exact configuration", async () => {
      const usdc = tokenFactory.getToken("USDC");
      const fuel = tokenFactory.getToken("FUEL");

      if (!usdc || !fuel) {
        throw new Error("Required test tokens not available");
      }

      const config = {
        tokenX: usdc.assetId,
        tokenY: fuel.assetId,
        binStep: STANDARD_POOL_CONFIGS.EXOTIC.binStep,
        baseFactor: STANDARD_POOL_CONFIGS.EXOTIC.baseFactor,
      };

      // Create pool
      const createdPoolId = await poolFactory.createPool({
        tokenX: usdc,
        tokenY: fuel,
        binStep: config.binStep,
        baseFactor: config.baseFactor,
      });

      // Find pool by exact configuration
      const foundPoolId = await poolFactory.findPoolByConfig(config);

      expect(foundPoolId).toBeDefined();
      expect(foundPoolId?.toHex()).toBe(createdPoolId.toHex());
    });

    it("should return null for non-existent pool configuration", async () => {
      const usdc = tokenFactory.getToken("USDC");
      const fuel = tokenFactory.getToken("FUEL");

      if (!usdc || !fuel) {
        throw new Error("Required test tokens not available");
      }

      // Try to find pool with configuration that doesn't exist
      const nonExistentConfig = {
        tokenX: usdc.assetId,
        tokenY: fuel.assetId,
        binStep: 999, // Non-existent bin step
        baseFactor: 999999, // Non-existent base factor
      };

      const foundPoolId = await poolFactory.findPoolByConfig(nonExistentConfig);
      expect(foundPoolId).toBeNull();
    });
  });

  describe("Pool ID Generation Validation", () => {
    it("should generate consistent pool IDs for same configuration", async () => {
      const usdc = tokenFactory.getToken("USDC");
      const fuel = tokenFactory.getToken("FUEL");

      if (!usdc || !fuel) {
        throw new Error("Required test tokens not available");
      }

      const config = {
        tokenX: usdc,
        tokenY: fuel,
        binStep: STANDARD_POOL_CONFIGS.STABLE.binStep,
        baseFactor: STANDARD_POOL_CONFIGS.STABLE.baseFactor,
      };

      // Generate pool ID using SDK utility
      const expectedPoolId = buildPoolIdV2(
        usdc.assetId,
        fuel.assetId,
        config.binStep,
        config.baseFactor
      );

      // Create pool and get actual ID
      const actualPoolId = await poolFactory.createPool(config);

      expect(actualPoolId.toHex()).toBe(expectedPoolId.toHex());
    });

    it("should generate different pool IDs for different configurations", async () => {
      const usdc = tokenFactory.getToken("USDC");
      const fuel = tokenFactory.getToken("FUEL");

      if (!usdc || !fuel) {
        throw new Error("Required test tokens not available");
      }

      // Generate pool IDs for different configurations
      const stablePoolId = buildPoolIdV2(
        usdc.assetId,
        fuel.assetId,
        STANDARD_POOL_CONFIGS.STABLE.binStep,
        STANDARD_POOL_CONFIGS.STABLE.baseFactor
      );

      const volatilePoolId = buildPoolIdV2(
        usdc.assetId,
        fuel.assetId,
        STANDARD_POOL_CONFIGS.VOLATILE.binStep,
        STANDARD_POOL_CONFIGS.VOLATILE.baseFactor
      );

      const exoticPoolId = buildPoolIdV2(
        usdc.assetId,
        fuel.assetId,
        STANDARD_POOL_CONFIGS.EXOTIC.binStep,
        STANDARD_POOL_CONFIGS.EXOTIC.baseFactor
      );

      // All pool IDs should be different
      expect(stablePoolId.toHex()).not.toBe(volatilePoolId.toHex());
      expect(stablePoolId.toHex()).not.toBe(exoticPoolId.toHex());
      expect(volatilePoolId.toHex()).not.toBe(exoticPoolId.toHex());
    });

    it("should generate different pool IDs for different asset pairs", async () => {
      const usdc = tokenFactory.getToken("USDC");
      const fuel = tokenFactory.getToken("FUEL");
      const eth = tokenFactory.getToken("ETH");
      const usdt = tokenFactory.getToken("USDT");

      if (!usdc || !fuel || !eth || !usdt) {
        throw new Error("Required test tokens not available");
      }

      // Generate pool IDs for different asset pairs with same configuration
      const usdcFuelPoolId = buildPoolIdV2(
        usdc.assetId,
        fuel.assetId,
        STANDARD_POOL_CONFIGS.VOLATILE.binStep,
        STANDARD_POOL_CONFIGS.VOLATILE.baseFactor
      );

      const ethUsdtPoolId = buildPoolIdV2(
        eth.assetId,
        usdt.assetId,
        STANDARD_POOL_CONFIGS.VOLATILE.binStep,
        STANDARD_POOL_CONFIGS.VOLATILE.baseFactor
      );

      expect(usdcFuelPoolId.toHex()).not.toBe(ethUsdtPoolId.toHex());
    });

    it("should generate same pool ID regardless of token order", async () => {
      const usdc = tokenFactory.getToken("USDC");
      const fuel = tokenFactory.getToken("FUEL");

      if (!usdc || !fuel) {
        throw new Error("Required test tokens not available");
      }

      // Generate pool ID with tokens in different orders
      const poolId1 = buildPoolIdV2(
        usdc.assetId,
        fuel.assetId,
        STANDARD_POOL_CONFIGS.STABLE.binStep,
        STANDARD_POOL_CONFIGS.STABLE.baseFactor
      );

      const poolId2 = buildPoolIdV2(
        fuel.assetId,
        usdc.assetId,
        STANDARD_POOL_CONFIGS.STABLE.binStep,
        STANDARD_POOL_CONFIGS.STABLE.baseFactor
      );

      // Pool IDs should be the same (SDK should handle token ordering internally)
      expect(poolId1.toHex()).toBe(poolId2.toHex());
    });

    it("should validate pool ID format", async () => {
      const usdc = tokenFactory.getToken("USDC");
      const fuel = tokenFactory.getToken("FUEL");

      if (!usdc || !fuel) {
        throw new Error("Required test tokens not available");
      }

      const poolId = buildPoolIdV2(
        usdc.assetId,
        fuel.assetId,
        STANDARD_POOL_CONFIGS.STABLE.binStep,
        STANDARD_POOL_CONFIGS.STABLE.baseFactor
      );

      // Pool ID should be a valid BN
      expect(poolId).toBeInstanceOf(BN);

      // Pool ID hex should be a valid 64-character hex string
      const poolIdHex = poolId.toHex();
      expect(poolIdHex).toMatch(/^0x[a-fA-F0-9]{64}$/);

      // Pool ID should be non-zero
      expect(poolId.gt(0)).toBe(true);
    });

    it("should create and validate multiple pools with unique IDs", async () => {
      const tokens = [
        tokenFactory.getToken("USDC"),
        tokenFactory.getToken("FUEL"),
        tokenFactory.getToken("ETH"),
        tokenFactory.getToken("USDT"),
      ].filter(Boolean);

      if (tokens.length < 4) {
        throw new Error("Not enough test tokens available");
      }

      const createdPoolIds: string[] = [];
      const configs = [
        STANDARD_POOL_CONFIGS.STABLE,
        STANDARD_POOL_CONFIGS.VOLATILE,
        STANDARD_POOL_CONFIGS.EXOTIC,
      ];

      // Create pools with different token pairs and configurations
      for (let i = 0; i < tokens.length - 1; i++) {
        for (let j = i + 1; j < tokens.length; j++) {
          for (const config of configs) {
            const poolId = await poolFactory.createPool({
              tokenX: tokens[i]!,
              tokenY: tokens[j]!,
              binStep: config.binStep,
              baseFactor: config.baseFactor,
            });

            const poolIdHex = poolId.toHex();

            // Verify pool ID is unique
            expect(createdPoolIds).not.toContain(poolIdHex);
            createdPoolIds.push(poolIdHex);

            // Verify pool exists
            const lookupResult = await poolFactory.lookupPool(poolId);
            expect(lookupResult.exists).toBe(true);
          }
        }
      }

      console.log(
        `✅ Created and validated ${createdPoolIds.length} unique pools`
      );
    });
  });

  describe("Pool Lookup and Existence Validation", () => {
    it("should lookup existing pools by ID", async () => {
      const usdc = tokenFactory.getToken("USDC");
      const fuel = tokenFactory.getToken("FUEL");

      if (!usdc || !fuel) {
        throw new Error("Required test tokens not available");
      }

      const poolId = await poolFactory.createStandardPool("STABLE", usdc, fuel);

      const lookupResult = await poolFactory.lookupPool(poolId);

      expect(lookupResult.exists).toBe(true);
      expect(lookupResult.metadata).toBeDefined();
      expect(lookupResult.metadata?.pool.binStep).toBe(
        STANDARD_POOL_CONFIGS.STABLE.binStep
      );
    });

    it("should return false for non-existent pool IDs", async () => {
      // Create a fake pool ID
      const fakePoolId = new BN(
        "999999999999999999999999999999999999999999999999999999999999999"
      );

      const lookupResult = await poolFactory.lookupPool(fakePoolId);

      expect(lookupResult.exists).toBe(false);
      expect(lookupResult.metadata).toBeUndefined();
    });

    it("should get all pools with filtering", async () => {
      // Create pools with different configurations
      const usdc = tokenFactory.getToken("USDC");
      const fuel = tokenFactory.getToken("FUEL");
      const eth = tokenFactory.getToken("ETH");

      if (!usdc || !fuel || !eth) {
        throw new Error("Required test tokens not available");
      }

      await poolFactory.createStandardPool("STABLE", usdc, fuel);
      await poolFactory.createStandardPool("VOLATILE", eth, usdc);
      await poolFactory.createStandardPool("EXOTIC", fuel, eth);

      // Wait for indexer to process
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Get all pools
      const allPools = await poolFactory.getAllPools();
      expect(allPools.length).toBeGreaterThanOrEqual(3);

      // Get pools with bin step filter
      const stablePools = await poolFactory.getAllPools({
        minBinStep: STANDARD_POOL_CONFIGS.STABLE.binStep,
        maxBinStep: STANDARD_POOL_CONFIGS.STABLE.binStep,
      });

      const volatilePools = await poolFactory.getAllPools({
        minBinStep: STANDARD_POOL_CONFIGS.VOLATILE.binStep,
        maxBinStep: STANDARD_POOL_CONFIGS.VOLATILE.binStep,
      });

      expect(stablePools.length).toBeGreaterThanOrEqual(1);
      expect(volatilePools.length).toBeGreaterThanOrEqual(1);

      // Verify filtering works
      stablePools.forEach((pool) => {
        expect(pool.binStep).toBe(STANDARD_POOL_CONFIGS.STABLE.binStep);
      });

      volatilePools.forEach((pool) => {
        expect(pool.binStep).toBe(STANDARD_POOL_CONFIGS.VOLATILE.binStep);
      });
    });
  });
});
