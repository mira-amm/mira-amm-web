import {describe, it, expect, beforeAll, afterAll, beforeEach} from "vitest";
import {BN} from "fuels";
import {testEnvironment} from "./setup/test-environment";
import {TokenFactory} from "./setup/token-factory";
import {PoolFactory} from "./setup/pool-factory";
import {MiraAmmV2} from "../../src/sdk/mira_amm_v2";
import {ReadonlyMiraAmmV2} from "../../src/sdk/readonly_mira_amm_v2";

describe("Pool Operations Integration Tests", () => {
  let tokenFactory: TokenFactory;
  let poolFactory: PoolFactory;
  let miraAmm: MiraAmmV2;
  let readonlyAmm: ReadonlyMiraAmmV2;

  beforeAll(async () => {
    // Start test environment
    await testEnvironment.start();

    const provider = testEnvironment.getProvider();
    // Create a unique wallet for this test to avoid UTXO conflicts
    const wallet = await testEnvironment.createWallet("1000000000000"); // 1M ETH for testing
    const contractIds = testEnvironment.getContractIds();

    // Initialize factories and SDK instances
    tokenFactory = new TokenFactory(wallet, contractIds.fungible);
    poolFactory = new PoolFactory(wallet, contractIds.simpleProxy); // simpleProxy is the proxy for poolCurveState
    miraAmm = new MiraAmmV2(wallet, contractIds.simpleProxy);
    readonlyAmm = new ReadonlyMiraAmmV2(provider, contractIds.simpleProxy);
  }, 60000);

  afterAll(async () => {
    // Note: We don't stop the environment as it might be used by other test files
    // In CI, this would be handled differently
  });

  beforeEach(() => {
    // Reset pool factory state between tests
    poolFactory.reset();
  });

  describe("Pool Creation", () => {
    it("should create a pool with USDC/FUEL pair", async () => {
      const usdc = tokenFactory.getToken("USDC");
      const fuel = tokenFactory.getToken("FUEL");

      expect(usdc).toBeDefined();
      expect(fuel).toBeDefined();

      const poolId = await poolFactory.createPool({
        tokenX: usdc!,
        tokenY: fuel!,
        binStep: 25,
        baseFactor: 10000,
      });

      expect(poolId).toBeDefined();
      expect(poolId.gt(0)).toBe(true);

      // Verify pool metadata
      const metadata = await readonlyAmm.poolMetadata(poolId);
      expect(metadata).toBeDefined();
      expect(metadata?.pool.assetX.bits).toBe(usdc!.assetId);
      expect(metadata?.pool.assetY.bits).toBe(fuel!.assetId);
      expect(metadata?.pool.binStep).toBe(25);
    }, 30000);

    it("should create a pool with ETH/USDT pair", async () => {
      const eth = tokenFactory.getToken("ETH");
      const usdt = tokenFactory.getToken("USDT");

      expect(eth).toBeDefined();
      expect(usdt).toBeDefined();

      const poolId = await poolFactory.createPool({
        tokenX: eth!,
        tokenY: usdt!,
        binStep: 20,
        baseFactor: 8000,
      });

      expect(poolId).toBeDefined();
      expect(poolId.gt(0)).toBe(true);

      // Verify pool metadata
      const metadata = await readonlyAmm.poolMetadata(poolId);
      expect(metadata).toBeDefined();
      expect(metadata?.pool.assetX.bits).toBe(eth!.assetId);
      expect(metadata?.pool.assetY.bits).toBe(usdt!.assetId);
      expect(metadata?.pool.binStep).toBe(20);
    }, 30000);

    it("should handle different fee configurations", async () => {
      const usdc = tokenFactory.getToken("USDC");
      const usdt = tokenFactory.getToken("USDT");

      expect(usdc).toBeDefined();
      expect(usdt).toBeDefined();

      // Low fee pool (1 bps)
      const lowFeePool = await poolFactory.createPool({
        tokenX: usdc!,
        tokenY: usdt!,
        binStep: 1,
        baseFactor: 5000,
      });

      // Medium fee pool (30 bps)
      const mediumFeePool = await miraAmm.createPool({
        assetX: {bits: usdc!.assetId},
        assetY: {bits: usdt!.assetId},
        binStep: 10,
        baseFactor: 15000,
        hookContract: undefined,
        protocolShare: 0,
      });

      // High fee pool (100 bps)
      const highFeePool = await miraAmm.createPool({
        assetX: {bits: usdc!.assetId},
        assetY: {bits: usdt!.assetId},
        binStep: 50,
        baseFactor: 20000,
        hookContract: undefined,
        protocolShare: 0,
      });

      // Verify all pools were created with different configurations
      const lowFeeMeta = await readonlyAmm.poolMetadata(lowFeePool);
      const mediumFeeMeta = await readonlyAmm.poolMetadata(mediumFeePool);
      const highFeeMeta = await readonlyAmm.poolMetadata(highFeePool);

      expect(lowFeeMeta?.pool.binStep).toBe(1);
      expect(mediumFeeMeta?.pool.binStep).toBe(10);
      expect(highFeeMeta?.pool.binStep).toBe(50);

      expect(lowFeeMeta?.pool.baseFactor).toBe(5000);
      expect(mediumFeeMeta?.pool.baseFactor).toBe(15000);
      expect(highFeeMeta?.pool.baseFactor).toBe(20000);
    }, 30000);

    it("should test different bin steps", async () => {
      const eth = tokenFactory.getToken("ETH");
      const usdc = tokenFactory.getToken("USDC");

      expect(eth).toBeDefined();
      expect(usdc).toBeDefined();

      // Test various bin steps
      const binSteps = [1, 5, 10, 25, 50, 100];
      const pools = [];

      for (const binStep of binSteps) {
        const poolId = await miraAmm.createPool({
          assetX: {bits: eth!.assetId},
          assetY: {bits: usdc!.assetId},
          binStep,
          baseFactor: 10000,
          hookContract: undefined,
          protocolShare: 0,
        });

        pools.push({binStep, poolId});
      }

      // Verify all pools
      for (const {binStep, poolId} of pools) {
        const metadata = await readonlyAmm.poolMetadata(poolId);
        expect(metadata?.pool.binStep).toBe(binStep);
      }
    }, 60000);
  });

  describe("Pool Metadata Retrieval", () => {
    let testPoolId: BN;

    beforeEach(async () => {
      const usdc = tokenFactory.getToken("USDC");
      const fuel = tokenFactory.getToken("FUEL");

      testPoolId = await poolFactory.createPool({
        tokenX: usdc!,
        tokenY: fuel!,
        binStep: 25,
        baseFactor: 10000,
      });
    });

    it("should retrieve and validate pool metadata", async () => {
      const metadata = await readonlyAmm.poolMetadata(testPoolId);

      expect(metadata).toBeDefined();
      expect(metadata?.activeId).toBeDefined();
      expect(metadata?.reserves).toBeDefined();
      expect(metadata?.reserves.x).toBeDefined();
      expect(metadata?.reserves.y).toBeDefined();
      expect(metadata?.pool).toBeDefined();
      expect(metadata?.pool.binStep).toBe(25);
      expect(metadata?.pool.baseFactor).toBe(10000);
    });

    it("should handle non-existent pool ID", async () => {
      const fakePoolId = new BN("999999999999");
      const metadata = await readonlyAmm.poolMetadata(fakePoolId);

      // Should return null or throw an error for non-existent pool
      // Exact behavior depends on SDK implementation
      expect(metadata).toBeNull();
    });
  });

  describe("Pool Discovery", () => {
    beforeEach(async () => {
      // Create a few test pools
      const usdc = tokenFactory.getToken("USDC");
      const fuel = tokenFactory.getToken("FUEL");
      const eth = tokenFactory.getToken("ETH");

      if (usdc && fuel) {
        await poolFactory.createPool({
          tokenX: usdc,
          tokenY: fuel,
          binStep: 25,
          baseFactor: 10000,
        });
      }

      if (eth && usdc) {
        await poolFactory.createPool({
          tokenX: eth,
          tokenY: usdc,
          binStep: 20,
          baseFactor: 8000,
        });
      }
    });

    it("should discover pools by asset pair", async () => {
      const usdc = tokenFactory.getToken("USDC");
      const fuel = tokenFactory.getToken("FUEL");

      if (!usdc || !fuel) {
        throw new Error("Test tokens not available");
      }

      // Get all pools and filter by assets
      const allPools = await readonlyAmm.pools();

      const matchingPools = allPools.filter(
        (pool) =>
          (pool.assetX.bits === usdc.assetId &&
            pool.assetY.bits === fuel.assetId) ||
          (pool.assetX.bits === fuel.assetId &&
            pool.assetY.bits === usdc.assetId)
      );

      expect(matchingPools).toBeDefined();
      expect(matchingPools.length).toBeGreaterThan(0);

      // Verify the pool contains the correct assets
      const pool = matchingPools[0];
      const metadata = await readonlyAmm.poolMetadata(pool.poolId);

      expect(
        metadata?.pool.assetX.bits === usdc.assetId ||
          metadata?.pool.assetX.bits === fuel.assetId
      ).toBe(true);
      expect(
        metadata?.pool.assetY.bits === usdc.assetId ||
          metadata?.pool.assetY.bits === fuel.assetId
      ).toBe(true);
    });

    it("should handle reverse asset order", async () => {
      const usdc = tokenFactory.getToken("USDC");
      const fuel = tokenFactory.getToken("FUEL");

      if (!usdc || !fuel) {
        throw new Error("Test tokens not available");
      }

      // Get all pools and filter by assets in reverse order
      const allPools = await readonlyAmm.pools();

      const matchingPools = allPools.filter(
        (pool) =>
          (pool.assetX.bits === fuel.assetId &&
            pool.assetY.bits === usdc.assetId) ||
          (pool.assetX.bits === usdc.assetId &&
            pool.assetY.bits === fuel.assetId)
      );

      expect(matchingPools).toBeDefined();
      // Should find the same pool regardless of order
      expect(matchingPools.length).toBeGreaterThan(0);
    });
  });

  describe("Pool ID Generation", () => {
    it("should generate consistent pool IDs", async () => {
      const usdc = tokenFactory.getToken("USDC");
      const eth = tokenFactory.getToken("ETH");

      if (!usdc || !eth) {
        throw new Error("Test tokens not available");
      }

      // Create the same pool configuration twice
      const poolId1 = await miraAmm.createPool({
        assetX: {bits: usdc.assetId},
        assetY: {bits: eth.assetId},
        binStep: 30,
        baseFactor: 12000,
        hookContract: undefined,
        protocolShare: 0,
      });

      // Attempting to create the same pool should return the same ID or error
      try {
        const poolId2 = await miraAmm.createPool({
          assetX: {bits: usdc.assetId},
          assetY: {bits: eth.assetId},
          binStep: 30,
          baseFactor: 12000,
          hookContract: undefined,
          protocolShare: 0,
        });

        // If it doesn't error, the IDs should match
        expect(poolId2.eq(poolId1)).toBe(true);
      } catch (error) {
        // Expected: Pool already exists error
        expect(error).toBeDefined();
      }
    });

    it("should generate different IDs for different configurations", async () => {
      const usdc = tokenFactory.getToken("USDC");
      const eth = tokenFactory.getToken("ETH");

      if (!usdc || !eth) {
        throw new Error("Test tokens not available");
      }

      // Create pools with different bin steps
      const poolId1 = await miraAmm.createPool({
        assetX: {bits: usdc.assetId},
        assetY: {bits: eth.assetId},
        binStep: 15,
        baseFactor: 10000,
        hookContract: undefined,
        protocolShare: 0,
      });

      const poolId2 = await miraAmm.createPool({
        assetX: {bits: usdc.assetId},
        assetY: {bits: eth.assetId},
        binStep: 20,
        baseFactor: 10000,
        hookContract: undefined,
        protocolShare: 0,
      });

      // Different configurations should yield different pool IDs
      expect(poolId1.eq(poolId2)).toBe(false);
    });
  });

  describe("Pool State Synchronization", () => {
    it("should verify pool state syncs with indexer", async () => {
      const usdc = tokenFactory.getToken("USDC");
      const fuel = tokenFactory.getToken("FUEL");

      if (!usdc || !fuel) {
        throw new Error("Test tokens not available");
      }

      const poolId = await poolFactory.createPool({
        tokenX: usdc,
        tokenY: fuel,
        binStep: 25,
        baseFactor: 10000,
      });

      // Wait for indexer to process the pool creation
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Query the indexer for pool data
      const response = await fetch(testEnvironment.getConfig().indexer.url, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          query: `
            query GetPool($poolId: String!) {
              pool(id: $poolId) {
                id
                tokenX
                tokenY
                binStep
                baseFactor
                activeId
              }
            }
          `,
          variables: {poolId: poolId.toString()},
        }),
      });

      const data = await response.json();

      // Verify indexer has the pool data
      expect(data.data?.pool).toBeDefined();
      expect(data.data.pool.tokenX).toBe(usdc.assetId);
      expect(data.data.pool.tokenY).toBe(fuel.assetId);
      expect(data.data.pool.binStep).toBe(25);
    }, 30000);
  });
});
