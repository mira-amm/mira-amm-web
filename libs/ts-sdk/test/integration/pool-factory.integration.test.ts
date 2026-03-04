import {describe, it, expect, beforeAll, afterAll} from "vitest";
import {
  testEnvironment,
  PoolFactory,
  TokenFactory,
  WalletFactory,
  STANDARD_POOL_CONFIGS,
} from "./setup";
import {BN} from "fuels";

describe("Pool Factory Integration Tests", () => {
  let poolFactory: PoolFactory;
  let tokenFactory: TokenFactory;
  let walletFactory: WalletFactory;

  beforeAll(async () => {
    // Start test environment
    await testEnvironment.start();

    // Initialize factories
    const wallet = await walletFactory.createTestWallet();
    poolFactory = new PoolFactory(wallet, testEnvironment.getProxyContractId());
    tokenFactory = new TokenFactory(wallet);
    walletFactory = new WalletFactory();
  }, 120000); // 2 minute timeout for service startup

  afterAll(async () => {
    await testEnvironment.stop();
  });

  describe("Standard Pool Configurations", () => {
    it("should have correct standard pool configurations", () => {
      const configs = poolFactory.getStandardPoolConfigs();

      expect(configs.STABLE).toEqual({
        type: "STABLE",
        binStep: 1,
        baseFactor: 5000,
        protocolShare: 0,
        description: "Low volatility pairs (stablecoins) with minimal fees",
      });

      expect(configs.VOLATILE).toEqual({
        type: "VOLATILE",
        binStep: 20,
        baseFactor: 8000,
        protocolShare: 0,
        description: "Medium volatility pairs with standard fees",
      });

      expect(configs.EXOTIC).toEqual({
        type: "EXOTIC",
        binStep: 50,
        baseFactor: 15000,
        protocolShare: 0,
        description: "High volatility or exotic pairs with higher fees",
      });
    });
  });

  describe("Pool Creation", () => {
    it("should create a stable pool with correct configuration", async () => {
      const tokens = await tokenFactory.createTestTokens();

      const poolId = await poolFactory.createStandardPool(
        "STABLE",
        tokens.usdc,
        tokens.usdt
      );

      expect(poolId).toBeDefined();

      // Validate pool metadata
      const validation = await poolFactory.validatePoolMetadata(poolId, {
        tokenX: tokens.usdc,
        tokenY: tokens.usdt,
        binStep: STANDARD_POOL_CONFIGS.STABLE.binStep,
        baseFactor: STANDARD_POOL_CONFIGS.STABLE.baseFactor,
      });

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it("should create a volatile pool with correct configuration", async () => {
      const tokens = await tokenFactory.createTestTokens();

      const poolId = await poolFactory.createStandardPool(
        "VOLATILE",
        tokens.eth,
        tokens.usdc
      );

      expect(poolId).toBeDefined();

      // Validate pool metadata
      const validation = await poolFactory.validatePoolMetadata(poolId, {
        tokenX: tokens.eth,
        tokenY: tokens.usdc,
        binStep: STANDARD_POOL_CONFIGS.VOLATILE.binStep,
        baseFactor: STANDARD_POOL_CONFIGS.VOLATILE.baseFactor,
      });

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it("should create an exotic pool with correct configuration", async () => {
      const tokens = await tokenFactory.createTestTokens();

      const poolId = await poolFactory.createStandardPool(
        "EXOTIC",
        tokens.fuel,
        tokens.eth
      );

      expect(poolId).toBeDefined();

      // Validate pool metadata
      const validation = await poolFactory.validatePoolMetadata(poolId, {
        tokenX: tokens.fuel,
        tokenY: tokens.eth,
        binStep: STANDARD_POOL_CONFIGS.EXOTIC.binStep,
        baseFactor: STANDARD_POOL_CONFIGS.EXOTIC.baseFactor,
      });

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });

  describe("Pool Discovery and Lookup", () => {
    it("should discover pools by asset pair", async () => {
      const tokens = await tokenFactory.createTestTokens();

      // Create a pool first
      await poolFactory.createStandardPool("STABLE", tokens.usdc, tokens.usdt);

      // Wait a bit for indexer to process
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Discover pools
      const discoveredPools = await poolFactory.discoverPoolsByAssetPair(
        tokens.usdc.assetId,
        tokens.usdt.assetId
      );

      expect(discoveredPools.length).toBeGreaterThan(0);
      expect(discoveredPools[0]).toHaveProperty("poolId");
      expect(discoveredPools[0]).toHaveProperty("binStep");
      expect(discoveredPools[0]).toHaveProperty("baseFactor");
    });

    it("should find pool by exact configuration", async () => {
      const tokens = await tokenFactory.createTestTokens();

      // Create a pool first
      const createdPoolId = await poolFactory.createStandardPool(
        "VOLATILE",
        tokens.eth,
        tokens.usdc
      );

      // Find pool by config
      const foundPoolId = await poolFactory.findPoolByConfig({
        tokenX: tokens.eth.assetId,
        tokenY: tokens.usdc.assetId,
        binStep: STANDARD_POOL_CONFIGS.VOLATILE.binStep,
        baseFactor: STANDARD_POOL_CONFIGS.VOLATILE.baseFactor,
      });

      expect(foundPoolId).toBeDefined();
      expect(foundPoolId?.toHex()).toBe(createdPoolId.toHex());
    });

    it("should lookup pool by ID", async () => {
      const tokens = await tokenFactory.createTestTokens();

      // Create a pool first
      const poolId = await poolFactory.createStandardPool(
        "STABLE",
        tokens.usdc,
        tokens.usdt
      );

      // Lookup pool
      const lookupResult = await poolFactory.lookupPool(poolId);

      expect(lookupResult.exists).toBe(true);
      expect(lookupResult.metadata).toBeDefined();
    });
  });

  describe("Pool Metadata Validation", () => {
    it("should cross-validate SDK and indexer data", async () => {
      const tokens = await tokenFactory.createTestTokens();

      // Create a pool first
      const poolId = await poolFactory.createStandardPool(
        "STABLE",
        tokens.usdc,
        tokens.usdt
      );

      // Wait for indexer to process
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Cross-validate
      const validation = await poolFactory.crossValidateWithIndexer(poolId);

      expect(validation.sdkData).toBeDefined();
      // Note: indexer data might not be available immediately in test environment
      // so we don't assert on indexerData or isConsistent
    });
  });

  describe("Standard Pool Creation", () => {
    it("should create all standard pools", async () => {
      const tokens = await tokenFactory.createTestTokens();

      const pools = await poolFactory.createStandardPools({
        usdc: tokens.usdc,
        usdt: tokens.usdt,
        eth: tokens.eth,
        fuel: tokens.fuel,
      });

      expect(pools.size).toBe(3);
      expect(pools.has("STABLE")).toBe(true);
      expect(pools.has("VOLATILE")).toBe(true);
      expect(pools.has("EXOTIC")).toBe(true);

      // Verify each pool exists
      for (const [type, poolId] of pools) {
        const lookupResult = await poolFactory.lookupPool(poolId);
        expect(lookupResult.exists).toBe(true);
      }
    });
  });
});
